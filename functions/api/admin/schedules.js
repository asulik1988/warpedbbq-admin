/**
 * Schedule Management
 * GET /api/admin/schedules?itemId=X - Get schedules for item
 * POST /api/admin/schedules - Create schedule
 * PUT /api/admin/schedules/:id - Update schedule
 * DELETE /api/admin/schedules/:id - Delete schedule
 */

function isAuthenticated(request) {
  const cookies = request.headers.get('Cookie') || '';
  return cookies.includes('admin_session=authenticated');
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({
    success: false,
    error: 'Unauthorized'
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

// GET - Get schedules for a menu item
export async function onRequestGet({ request, env }) {
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');

    if (!itemId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'itemId query parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { results } = await env.DB.prepare(`
      SELECT * FROM menu_schedules
      WHERE menu_item_id = ?
      ORDER BY day_of_week, start_time
    `).bind(itemId).all();

    return new Response(JSON.stringify({
      success: true,
      data: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch schedules',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - Create new schedule
export async function onRequestPost({ request, env }) {
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const data = await request.json();
    const { menuItemId, dayOfWeek, startTime, endTime, isActive } = data;

    if (!menuItemId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'menuItemId is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.DB.prepare(`
      INSERT INTO menu_schedules (menu_item_id, day_of_week, start_time, end_time, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      menuItemId,
      dayOfWeek !== null ? dayOfWeek : null,
      startTime || null,
      endTime || null,
      isActive !== undefined ? (isActive ? 1 : 0) : 1
    ).run();

    return new Response(JSON.stringify({
      success: true,
      data: { id: result.meta.last_row_id }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create schedule',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
