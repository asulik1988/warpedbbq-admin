# Admin Panel Quick Reference

## 🚀 Quick Start

```bash
# First time setup
wrangler login
wrangler secret put ADMIN_PASSWORD
# Update wrangler.toml with database_id

# Local development
wrangler pages dev public --binding DB=warpedbbq-menu

# Deploy
wrangler pages deploy public --project-name=warpedbbq-admin
```

## 🔑 Login
- URL: https://admin.warpedbbq.com (or localhost:8788)
- Password: Set via `wrangler secret put ADMIN_PASSWORD`

## 📝 Menu Management

### Add Item
1. Click "+ Add New Item"
2. Fill in title, description, category
3. (Optional) Upload image
4. (Optional) Set tag (e.g., "Weekend special")
5. Set display order
6. Click "Save"

### Edit Item
1. Click "Edit" on any item
2. Modify fields
3. Click "Save Changes"

### Delete Item
1. Click "Delete" on item
2. Confirm deletion
3. Item and all related data removed

### Reorder Items
1. Click "⇅ Reorder" button
2. Drag and drop items to new positions
3. Order saves automatically

## 📦 Inventory Management

### Set Stock Levels
- **Blank**: Unlimited stock (default)
- **Number**: Track specific quantity
- **Sold Out checkbox**: Mark unavailable

### Stock Badges
- **Available**: Green (stock > threshold or unlimited)
- **Low Stock**: Yellow (stock ≤ threshold)
- **Sold Out**: Red (is_sold_out = true OR stock = 0)

### Quick Actions
```bash
# Set item to sold out
Check "Mark as Sold Out" → Saves automatically

# Set low stock threshold
Enter number in "Low Stock Threshold" → Saves automatically

# Track inventory
Enter number in "Current Stock" → Saves automatically
```

## 📅 Schedules

### Weekend Special Example
1. Go to Schedules tab
2. Select menu item
3. Add schedule: Saturday + Sunday
4. Leave time blank for "all day"
5. Save

### Time-Based Availability
1. Select item
2. Add schedule with:
   - Day: e.g., Friday
   - Start: e.g., 17:00
   - End: e.g., 21:00
3. Item only shows during those hours

## 🗑️ Cache Management

### Development Cache (Local Testing)
1. Go to Cache tab
2. Click "🔧 Clear Dev Cache"
3. Changes appear immediately on localhost
4. Use this when testing changes locally

**When to use:**
- Testing menu changes locally
- Verifying inventory updates work
- Testing cache behavior
- Development workflow

### Production Cache (Live Site)
1. Go to Cache tab
2. Click "🗑️ Clear Production Cache"
3. Wait for confirmation
4. Changes appear on warpedbbq.com in ~5 minutes

**When to use:**
- After adding/editing menu items
- After changing inventory
- After uploading new images
- After updating schedules
- Deploying changes to production

## 🖼️ Image Guidelines

### Accepted Formats
- JPEG/JPG
- PNG
- WebP

### Recommendations
- Max size: 10MB
- Recommended: 800x600px
- Compress before upload
- Use descriptive filenames

### Upload Process
1. Click "Choose File" in item form
2. Select image
3. Preview appears
4. Save item → Image uploads to R2
5. URL: `https://images.warpedbbq.com/menu/...`

## 🔍 Monitoring

### Check Inventory Status
```bash
wrangler d1 execute warpedbbq-menu --remote --command="
SELECT
  m.title,
  i.current_stock,
  i.low_stock_threshold,
  i.is_sold_out
FROM menu_items m
JOIN inventory i ON m.id = i.menu_item_id
WHERE i.is_sold_out = 1 OR i.current_stock <= i.low_stock_threshold
"
```

### View Cache Version
```bash
wrangler d1 execute warpedbbq-menu --remote --command="SELECT * FROM cache_version"
```

### List All Menu Items
```bash
wrangler d1 execute warpedbbq-menu --remote --command="SELECT id, title, category, is_active FROM menu_items ORDER BY display_order"
```

## ⚠️ Common Issues

### Can't Login
- Check secret is set: `wrangler secret list`
- Clear browser cookies
- Try incognito mode

### Images Won't Upload
- Check file size < 10MB
- Verify R2 binding configured
- Check file format (JPEG/PNG/WebP)

### Changes Don't Appear
- Clear cache in admin panel
- Wait 5 minutes for CDN
- Hard refresh browser (Cmd+Shift+R)

### Database Errors
- Verify D1 binding name is `DB`
- Check database_id in wrangler.toml
- Redeploy after config changes

## 🎯 Best Practices

### Daily Operations
1. Update sold out items as stock depletes
2. Clear cache after changes
3. Check inventory levels regularly
4. Update schedules for specials

### Weekly Tasks
1. Review inventory thresholds
2. Update menu for upcoming week
3. Upload new item images
4. Test on main site

### Image Optimization
1. Resize before upload (800x600)
2. Compress with tool like TinyPNG
3. Use WebP for best performance
4. Name files descriptively

## 📊 Database Schema Quick Reference

```
menu_items
├── id (PK)
├── title
├── description
├── category (meat/side/dessert)
├── tag
├── image_url
├── display_order
├── is_active (1/0)
└── timestamps

inventory
├── id (PK)
├── menu_item_id (FK)
├── current_stock (NULL = unlimited)
├── low_stock_threshold
├── is_sold_out (1/0)
└── last_updated

menu_schedules
├── id (PK)
├── menu_item_id (FK)
├── day_of_week (0-6, NULL = all)
├── start_time (HH:MM, NULL = all day)
├── end_time (HH:MM, NULL = all day)
└── is_active (1/0)
```

## 🔗 Quick Links

- Main Site: https://warpedbbq.com
- Admin Panel: https://admin.warpedbbq.com
- Images CDN: https://images.warpedbbq.com
- Dashboard: https://dash.cloudflare.com

## 📞 Support

Issues? Check:
1. Cloudflare Dashboard logs
2. Browser console
3. TESTING_AND_DEPLOYMENT.md
4. README.md

---

**Remember**: Always clear cache after making changes!
