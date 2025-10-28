/**
 * POST /api/admin/cache/purge
 * Clear CDN cache and increment cache version
 */

function isAuthenticated(request) {
  const cookies = request.headers.get('Cookie') || '';
  return cookies.includes('admin_session=authenticated');
}

export async function onRequestPost({ request, env }) {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Increment cache version in database
    await env.DB.prepare(`
      UPDATE cache_version
      SET version = version + 1, last_cleared = datetime('now')
      WHERE id = 1
    `).run();

    // Get new cache version
    const result = await env.DB.prepare(`
      SELECT version, last_cleared
      FROM cache_version
      WHERE id = 1
    `).first();

    // Purge Cloudflare cache via API if credentials are set
    let cloudflareCleared = false;
    if (env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ZONE_ID) {
      try {
        await fetch(`https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            purge_everything: true
          })
        });
        cloudflareCleared = true;
      } catch (error) {
        console.error('Failed to purge Cloudflare cache:', error);
        // Continue anyway, cache will expire naturally
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Cache cleared successfully',
      data: {
        cacheVersion: result.version,
        timestamp: result.last_cleared,
        cloudflareCleared
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
