/**
 * GET/POST /api/admin/batches
 * List all batches or create a new batch
 */

function isAuthenticated(request) {
  const cookies = request.headers.get('Cookie') || '';
  return cookies.includes('admin_session=authenticated');
}

export async function onRequestGet({ request, env }) {
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
    // Get all batches with order counts
    const result = await env.DB.prepare(`
      SELECT
        pb.*,
        COUNT(DISTINCT o.id) as orderCount
      FROM pickup_batches pb
      LEFT JOIN orders o ON pb.id = o.batch_id AND o.status != 'cancelled'
      GROUP BY pb.id
      ORDER BY pb.pickup_date DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      data: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch batches',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
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
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.pickupDate || !data.pickupTimeStart || !data.pickupTimeEnd || !data.cutoffDate) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert batch
    const result = await env.DB.prepare(`
      INSERT INTO pickup_batches (
        name, pickup_date, pickup_time_start, pickup_time_end,
        cutoff_date, max_capacity, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.pickupDate,
      data.pickupTimeStart,
      data.pickupTimeEnd,
      data.cutoffDate,
      data.maxCapacity || null,
      data.status || 'open'
    ).run();

    if (!result.success) {
      throw new Error('Failed to create batch');
    }

    const batchId = result.meta.last_row_id;

    // Create inventory snapshot for this batch
    await env.DB.prepare(`
      INSERT INTO batch_inventory_snapshot (batch_id, menu_item_id, available_quantity, reserved_quantity)
      SELECT
        ?,
        mi.id,
        COALESCE(inv.current_stock, 999),
        0
      FROM menu_items mi
      LEFT JOIN inventory inv ON mi.id = inv.menu_item_id
      WHERE mi.is_active = 1
    `).bind(batchId).run();

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: batchId,
        message: 'Batch created successfully'
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create batch',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
