/**
 * PUT /api/admin/inventory/:id
 * Update inventory for a menu item
 */

function isAuthenticated(request) {
  const cookies = request.headers.get('Cookie') || '';
  return cookies.includes('admin_session=authenticated');
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
    const { id } = params; // menu_item_id
    const data = await request.json();

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if ('currentStock' in data) {
      updates.push('current_stock = ?');
      values.push(data.currentStock);
    }

    if ('lowStockThreshold' in data) {
      updates.push('low_stock_threshold = ?');
      values.push(data.lowStockThreshold);
    }

    if ('isSoldOut' in data) {
      updates.push('is_sold_out = ?');
      values.push(data.isSoldOut ? 1 : 0);
    }

    updates.push('last_updated = datetime(\'now\')');
    values.push(id);

    if (updates.length === 1) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No fields to update'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const query = `
      UPDATE inventory
      SET ${updates.join(', ')}
      WHERE menu_item_id = ?
    `;

    await env.DB.prepare(query).bind(...values).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Inventory updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update inventory',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
