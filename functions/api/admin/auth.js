/**
 * Admin Authentication
 * POST /api/admin/auth - Login
 * POST /api/admin/logout - Logout
 */

// Simple session management using cookies
const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_VALUE = 'authenticated'; // In production, use signed tokens

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);

  // Logout
  if (url.pathname.endsWith('/logout')) {
    return new Response(JSON.stringify({
      success: true,
      message: 'Logged out successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
      }
    });
  }

  // Login
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Password is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check password against environment variable
    if (password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid password'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set session cookie
    const sessionTimeout = env.SESSION_TIMEOUT || 86400; // 24 hours default

    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${SESSION_COOKIE_NAME}=${SESSION_VALUE}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${sessionTimeout}`
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Check if request is authenticated
export function isAuthenticated(request) {
  const cookies = request.headers.get('Cookie') || '';
  return cookies.includes(`${SESSION_COOKIE_NAME}=${SESSION_VALUE}`);
}
