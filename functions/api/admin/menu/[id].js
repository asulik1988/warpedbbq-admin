/**
 * Admin Single Menu Item Operations
 * GET /api/admin/menu/:id - Get single item
 * PUT /api/admin/menu/:id - Update item
 * DELETE /api/admin/menu/:id - Delete item
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

// GET - Get single item
export async function onRequestGet({ request, env, params }) {
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = params;

    const item = await env.DB.prepare(`
      SELECT
        m.*,
        i.current_stock,
        i.low_stock_threshold,
        i.is_sold_out
      FROM menu_items m
      LEFT JOIN inventory i ON m.id = i.menu_item_id
      WHERE m.id = ?
    `).bind(id).first();

    if (!item) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Item not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: item
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch item',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT - Update item
export async function onRequestPut({ request, env, params }) {
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = params;
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

    // Update menu item
    const updateQuery = `
      UPDATE menu_items
      SET
        title = ?,
        description = ?,
        category = ?,
        tag = ?,
        image_url = ?,
        display_order = ?,
        is_active = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `;

    await env.DB.prepare(updateQuery)
      .bind(
        title,
        description,
        category,
        tag || null,
        imageUrl || null,
        displayOrder,
        isActive !== undefined ? isActive : 1,
        id
      )
      .run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Item updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update item',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE - Delete item
export async function onRequestDelete({ request, env, params }) {
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = params;

    // Delete menu item (cascade will delete inventory and schedules)
    await env.DB.prepare('DELETE FROM menu_items WHERE id = ?')
      .bind(id)
      .run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Item deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete item',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
