/**
 * Individual Schedule Operations
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

// PUT - Update schedule
export async function onRequestPut({ request, env, params }) {
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = params;
    const data = await request.json();
    const { dayOfWeek, startTime, endTime, isActive } = data;

    await env.DB.prepare(`
      UPDATE menu_schedules
      SET
        day_of_week = ?,
        start_time = ?,
        end_time = ?,
        is_active = ?
      WHERE id = ?
    `).bind(
      dayOfWeek !== null ? dayOfWeek : null,
      startTime || null,
      endTime || null,
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      id
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Schedule updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update schedule',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE - Delete schedule
export async function onRequestDelete({ request, env, params }) {
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = params;

    await env.DB.prepare('DELETE FROM menu_schedules WHERE id = ?')
      .bind(id)
      .run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Schedule deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete schedule',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
