/**
 * POST /api/admin/logout
 * Logout and clear session
 */

const SESSION_COOKIE_NAME = 'admin_session';

export async function onRequestPost() {
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
