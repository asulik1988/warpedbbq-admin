# Cloudflare Pages Deployment Guide

Your warpedbbq-admin repository is now on GitHub! 🎉

**Repository URL**: https://github.com/asulik1988/warpedbbq-admin

## Quick Deploy to Cloudflare Pages

### Step 1: Connect Repository to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages**
3. Click **Create application**
4. Select **Pages** tab
5. Click **Connect to Git**
6. Select **GitHub** and authorize if needed
7. Select repository: `asulik1988/warpedbbq-admin`
8. Click **Begin setup**

### Step 2: Configure Build Settings

**Project name**: `warpedbbq-admin`

**Build settings**:
- Framework preset: **None**
- Build command: (leave empty)
- Build output directory: `public`
- Root directory: (leave empty)

Click **Save and Deploy**

### Step 3: Add Environment Bindings

After first deployment completes:

1. Go to **Settings** → **Functions**
2. Scroll to **Bindings**

**Add D1 Database Binding**:
- Click **Add binding**
- Type: **D1 database**
- Variable name: `DB`
- D1 database: Select `warpedbbq-site-backend`
- Click **Save**

**Add R2 Bucket Binding**:
- Click **Add binding**
- Type: **R2 bucket**
- Variable name: `IMAGES`
- R2 bucket: Select `warpedbbq-site-bucket`
- Click **Save**

### Step 4: Add Admin Password

1. Go to **Settings** → **Environment variables**
2. Click **Add variables**
3. For **Production** environment:
   - Variable name: `ADMIN_PASSWORD`
   - Type: **Secret** (select from dropdown)
   - Value: Enter your secure admin password
4. Click **Save**

Optional (for automatic cache purging):
- `CLOUDFLARE_API_TOKEN`: Your API token with cache purge permissions
- `CLOUDFLARE_ZONE_ID`: Your zone ID from dashboard

### Step 5: Redeploy

After adding bindings and secrets:
1. Go to **Deployments**
2. Click **...** on latest deployment
3. Click **Retry deployment**

### Step 6: Set Custom Domain (Optional)

1. Go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `admin.warpedbbq.com`
4. Follow DNS instructions
5. Wait for SSL certificate to provision (~5 minutes)

## Testing Your Deployment

1. Visit your admin panel:
   - Pages URL: `https://warpedbbq-admin.pages.dev`
   - Custom domain: `https://admin.warpedbbq.com` (if configured)

2. Login with your password

3. Test features:
   - ✅ Menu items list loads
   - ✅ Can add/edit items
   - ✅ Inventory management works
   - ✅ Image upload to R2 works
   - ✅ Cache clear works

## Quick Commands

```bash
# Local development
cd /Users/adamsulik/Documents/git/warpedbbq-admin
wrangler secret put ADMIN_PASSWORD  # Set password for local testing
wrangler pages dev public --binding DB=warpedbbq-site-backend

# Push updates to GitHub (auto-deploys)
git add .
git commit -m "Update admin panel"
git push origin main

# Direct deploy (bypass GitHub)
wrangler pages deploy public --project-name=warpedbbq-admin
```

## Environment Variables Reference

### Required
- `ADMIN_PASSWORD` (Secret): Login password for admin panel

### Optional
- `CLOUDFLARE_API_TOKEN` (Secret): For automatic cache purging via API
- `CLOUDFLARE_ZONE_ID` (Variable): Your Cloudflare zone ID
- `MAIN_SITE_URL` (Variable): Main site URL (default: https://warpedbbq.com)
- `SESSION_TIMEOUT` (Variable): Session duration in seconds (default: 86400 = 24 hours)

## Troubleshooting

### Can't Login
- Verify `ADMIN_PASSWORD` secret is set in Environment variables
- Check it's set for the correct environment (Production/Preview)
- Redeploy after adding the secret

### Database Errors
- Verify D1 binding name is exactly `DB` (case-sensitive)
- Confirm `warpedbbq-site-backend` database exists
- Check binding is added for Production environment

### Images Won't Upload
- Verify R2 binding name is exactly `IMAGES` (case-sensitive)
- Confirm `warpedbbq-site-bucket` exists
- Check R2 public access is configured

### Changes Don't Deploy
- Check **Deployments** tab for build errors
- Verify GitHub integration is active
- Try manual deployment: **Deployments** → **Create deployment**

## GitHub Actions (Optional)

To add automatic tests before deployment, create `.github/workflows/test.yml`:

```yaml
name: Test Admin Panel
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate Files
        run: |
          test -f public/index.html
          test -f public/dashboard.html
          test -f wrangler.toml
```

## Security Notes

- ✅ Admin password is stored as encrypted secret
- ✅ Session cookies are httpOnly and secure
- ✅ All admin endpoints check authentication
- ✅ No sensitive data exposed in client code
- ⚠️ Change password after initial setup
- ⚠️ Use strong password (16+ characters)

## Success Checklist ✓

- [ ] Repository pushed to GitHub
- [ ] Connected to Cloudflare Pages
- [ ] D1 binding configured
- [ ] R2 binding configured
- [ ] Admin password set
- [ ] First deployment successful
- [ ] Can login to admin panel
- [ ] Menu items load correctly
- [ ] Can add/edit items
- [ ] Image upload works
- [ ] Cache clear works

## Next Steps

Once deployed:
1. Login and test all features
2. Add your first menu item via admin
3. Upload an image
4. Clear cache and verify main site updates
5. Set up custom domain (optional)

---

**Repository**: https://github.com/asulik1988/warpedbbq-admin
**Deployed**: Ready to connect to Cloudflare Pages!
