/**
 * GET/PUT/DELETE /api/admin/batches/[id]
 * Get, update, or delete a specific batch
 */

function isAuthenticated(request) {
  const cookies = request.headers.get('Cookie') || '';
  return cookies.includes('admin_session=authenticated');
}

export async function onRequestGet({ request, env, params }) {
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
    const result = await env.DB.prepare(`
      SELECT * FROM pickup_batches WHERE id = ?
    `).bind(params.id).first();

    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Batch not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch batch',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPut({ request, env, params }) {
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
    const data = await request.json();

    const result = await env.DB.prepare(`
      UPDATE pickup_batches
      SET name = ?,
          pickup_date = ?,
          pickup_time_start = ?,
          pickup_time_end = ?,
          cutoff_date = ?,
          max_capacity = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      data.name,
      data.pickupDate,
      data.pickupTimeStart,
      data.pickupTimeEnd,
      data.cutoffDate,
      data.maxCapacity || null,
      data.status || 'open',
      params.id
    ).run();

    if (!result.success) {
      throw new Error('Failed to update batch');
    }

    return new Response(JSON.stringify({
      success: true,
      data: { message: 'Batch updated successfully' }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update batch',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete({ request, env, params }) {
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
    // Check if batch has orders
    const orderCheck = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE batch_id = ?
    `).bind(params.id).first();

    if (orderCheck.count > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot delete batch with existing orders'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.DB.prepare(`
      DELETE FROM pickup_batches WHERE id = ?
    `).bind(params.id).run();

    if (!result.success) {
      throw new Error('Failed to delete batch');
    }

    return new Response(JSON.stringify({
      success: true,
      data: { message: 'Batch deleted successfully' }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete batch',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
