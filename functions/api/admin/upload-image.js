/**
 * POST /api/admin/upload-image
 * Upload image to R2 bucket
 */

function isAuthenticated(request) {
  const cookies = request.headers.get('Cookie') || '';
  return cookies.includes('admin_session=authenticated');
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
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image || !(image instanceof File)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No image file provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(image.type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (image.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = image.type.split('/')[1];
    const filename = `menu/${timestamp}-${randomStr}.${extension}`;

    // Upload to R2
    await env.IMAGES.put(filename, image.stream(), {
      httpMetadata: {
        contentType: image.type
      }
    });

    // Return URL
    const imageUrl = `https://images.warpedbbq.com/${filename}`;

    return new Response(JSON.stringify({
      success: true,
      data: {
        filename,
        url: imageUrl
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to upload image',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
