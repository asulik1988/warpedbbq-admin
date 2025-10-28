/**
 * GET /api/admin/orders
 * List all orders with customer and batch information
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
    // Get all orders with customer and batch info
    const result = await env.DB.prepare(`
      SELECT
        o.id,
        o.subtotal,
        o.tax,
        o.total,
        o.status,
        o.created_at as createdAt,
        c.first_name || ' ' || c.last_name as customerName,
        c.email as customerEmail,
        c.phone as customerPhone,
        pb.name as batchName,
        pb.pickup_date as pickupDate
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN pickup_batches pb ON o.batch_id = pb.id
      ORDER BY o.created_at DESC
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
      error: 'Failed to fetch orders',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
