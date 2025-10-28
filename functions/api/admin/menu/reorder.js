/**
 * POST /api/admin/menu/reorder
 * Update display order of menu items
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
    const { order } = await request.json();

    if (!Array.isArray(order)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid order data'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update each item's display order
    for (const item of order) {
      await env.DB.prepare(`
        UPDATE menu_items
        SET display_order = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(item.displayOrder, item.id).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Order updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update order',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
