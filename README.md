# Warped BBQ Admin Panel

Admin interface for managing menu items, inventory, schedules, and images for WarpedBBQ.com.

## Features

- 🔐 Simple password authentication
- 📝 Full CRUD operations for menu items
- 📦 Real-time inventory management
- 📅 Schedule availability by day/time
- 🖼️ Direct image uploads to R2
- 🗑️ Cache purging with one click
- 📊 Stock level indicators and alerts

## Quick Start

### 1. Install Dependencies

```bash
npm install -g wrangler
wrangler login
```

### 2. Set Admin Password

```bash
wrangler secret put ADMIN_PASSWORD
# Enter your secure password when prompted
```

### 3. Update wrangler.toml

Add the D1 database ID from the main warpedbbq project:

```toml
database_id = "your-database-id-here"
```

### 4. Run Locally

```bash
wrangler pages dev public --binding DB=warpedbbq-menu
```

Visit http://localhost:8788

### 5. Deploy

```bash
wrangler pages deploy public --project-name=warpedbbq-admin
```

## Configuration

### Required Secrets

Set via Wrangler CLI:

```bash
# Admin login password
wrangler secret put ADMIN_PASSWORD

# Optional: For automatic cache purging
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put CLOUDFLARE_ZONE_ID
```

### Environment Variables

Edit `wrangler.toml`:

- `SESSION_TIMEOUT` - Session duration in seconds (default: 24 hours)
- `MAIN_SITE_URL` - Main site URL for cache purging

## Usage

### Login

Navigate to the admin panel URL and enter your password.

### Managing Menu Items

**Add Item:**
1. Click "Add New Item"
2. Fill in title, description, category
3. Set display order
4. Upload image (optional)
5. Click "Save"

**Edit Item:**
1. Click "Edit" on any menu item
2. Update fields
3. Click "Save Changes"

**Delete Item:**
1. Click "Delete" on menu item
2. Confirm deletion

**Reorder Items:**
1. Click "Reorder Mode"
2. Drag and drop items
3. Click "Save Order"

### Inventory Management

Set stock levels for each item:
- Leave blank for unlimited stock
- Enter number for tracked inventory
- Toggle "Sold Out" to mark unavailable
- Set low stock threshold for warnings

### Scheduling

Set when items are available:
- Select days of week
- Set time ranges (optional)
- Multiple schedules per item supported
- Toggle active/inactive

### Cache Management

Click "Clear Cache" to:
1. Increment cache version in database
2. Purge Cloudflare CDN cache
3. Force refresh on main site

## API Endpoints

### Authentication
- `POST /api/admin/auth` - Login with password
- `POST /api/admin/logout` - End session

### Menu Items
- `GET /api/admin/menu` - List all items (including inactive)
- `POST /api/admin/menu` - Create new item
- `GET /api/admin/menu/:id` - Get single item
- `PUT /api/admin/menu/:id` - Update item
- `DELETE /api/admin/menu/:id` - Delete item
- `POST /api/admin/menu/reorder` - Update display order

### Inventory
- `PUT /api/admin/inventory/:id` - Update stock levels
- `GET /api/admin/inventory` - Get all inventory

### Schedules
- `GET /api/admin/schedules/:itemId` - Get item schedules
- `POST /api/admin/schedules` - Create schedule
- `PUT /api/admin/schedules/:id` - Update schedule
- `DELETE /api/admin/schedules/:id` - Delete schedule

### Images
- `POST /api/admin/upload-image` - Upload to R2
- `DELETE /api/admin/image/:key` - Delete from R2

### Cache
- `POST /api/admin/cache/purge` - Clear cache

## Security

- Password-based authentication
- Session cookies (httpOnly, secure)
- All admin endpoints check authentication
- Automatic session timeout (24 hours default)
- No signup - password set via Wrangler secrets

## Deployment

### Development

```bash
git remote add origin https://github.com/yourusername/warpedbbq-admin.git
git add .
git commit -m "Initial admin panel"
git push -u origin main
```

### Production

Connect to Cloudflare Pages:
1. Dashboard → Workers & Pages → Create
2. Connect to Git repository
3. Build settings:
   - Build output: `public`
   - No build command needed
4. Add environment bindings:
   - D1: `DB` → `warpedbbq-menu`
   - R2: `IMAGES` → `warpedbbq-site-bucket`
5. Add secrets in Settings → Environment variables

Custom domain: `admin.warpedbbq.com`

## Development

### Project Structure

```
warpedbbq-admin/
├── public/
│   ├── index.html          # Login page
│   ├── dashboard.html      # Main dashboard
│   ├── styles.css          # Styling
│   └── admin.js            # Client-side logic
├── functions/
│   └── api/admin/
│       ├── auth.js         # Authentication
│       ├── menu.js         # Menu CRUD
│       ├── menu/
│       │   ├── [id].js     # Single item operations
│       │   └── reorder.js  # Reordering
│       ├── inventory/
│       │   └── [id].js     # Inventory updates
│       ├── schedules/
│       │   ├── [itemId].js # Get schedules
│       │   └── manage.js   # Create/update/delete
│       ├── upload-image.js # R2 uploads
│       └── cache/
│           └── purge.js    # Cache clearing
├── wrangler.toml
└── README.md
```

## Troubleshooting

**Can't login:**
- Verify `ADMIN_PASSWORD` secret is set
- Check browser console for errors
- Clear cookies and try again

**Images not uploading:**
- Verify R2 binding in Pages settings
- Check R2 bucket exists and is accessible
- Ensure image size < 10MB

**Cache not clearing:**
- Verify Cloudflare API token has cache purge permissions
- Check zone ID is correct
- Manual purge via Cloudflare dashboard as backup

## Support

For issues or questions, contact hello@warpedbbq.com
