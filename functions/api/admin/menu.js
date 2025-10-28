/**
 * Admin Menu Management
 * GET /api/admin/menu - List all menu items (including inactive)
 * POST /api/admin/menu - Create new menu item
 */

// Auth middleware
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

// GET - List all menu items
export async function onRequestGet({ request, env }) {
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const query = `
      SELECT
        m.id,
        m.title,
        m.description,
        m.category,
        m.tag,
        m.image_url as imageUrl,
        m.display_order as displayOrder,
        m.is_active as isActive,
        m.created_at as createdAt,
        m.updated_at as updatedAt,
        i.current_stock as currentStock,
        i.low_stock_threshold as lowStockThreshold,
        i.is_sold_out as isSoldOut
      FROM menu_items m
      LEFT JOIN inventory i ON m.id = i.menu_item_id
      ORDER BY m.display_order ASC
    `;

    const { results } = await env.DB.prepare(query).all();

    // Format the results
    const items = results.map(item => ({
      ...item,
      isActive: item.isActive === 1,
      inventory: {
        currentStock: item.currentStock,
        lowStockThreshold: item.lowStockThreshold,
        isSoldOut: item.isSoldOut === 1
      }
    }));

    return new Response(JSON.stringify({
      success: true,
      data: items
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch menu items',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - Create new menu item
export async function onRequestPost({ request, env }) {
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const data = await request.json();
    const {
      title,
      description,
      category,
      tag,
      imageUrl,
      displayOrder,
      isActive
    } = data;

    // Validate required fields
    if (!title || !description || !category) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert menu item
    const insertQuery = `
      INSERT INTO menu_items (title, description, category, tag, image_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await env.DB.prepare(insertQuery)
      .bind(
        title,
        description,
        category,
        tag || null,
        imageUrl || null,
        displayOrder || 999,
        isActive !== undefined ? isActive : 1
      )
      .run();

    // Get the inserted item ID
    const itemId = result.meta.last_row_id;

    // Create inventory record
    await env.DB.prepare(`
      INSERT INTO inventory (menu_item_id, low_stock_threshold, is_sold_out)
      VALUES (?, 5, 0)
    `).bind(itemId).run();

    return new Response(JSON.stringify({
      success: true,
      data: { id: itemId }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create menu item',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
