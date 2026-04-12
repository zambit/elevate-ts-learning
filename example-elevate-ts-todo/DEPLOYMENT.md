# Deployment to Cloudflare Pages

This guide documents how to deploy the app to Cloudflare Pages.

## Deployment Options

### Option 1: GitHub-Based Deployment (Recommended)

Configure Cloudflare Pages to auto-deploy from GitHub:

1. In Cloudflare Pages, connect your GitHub repository
2. Set build command: `pnpm install && pnpm -C example-elevate-ts-todo build`
3. Set output directory: `example-elevate-ts-todo/build`
4. On each commit to main, Cloudflare will build and deploy automatically
5. Preview deployments are created for each branch

### Option 2: Direct Deployment with Wrangler

Build locally and deploy directly:

```bash
pnpm build
export CLOUDFLARE_ACCOUNT_ID="8466c37d9f61e4ad152f8425735a98f8"
pnpm wrangler pages deploy build --project-name=elevate-ts-todo
```

## How SPA Routing Works

- SvelteKit's `adapter-static` generates `index.html` as the SPA fallback
- Cloudflare Pages serves `index.html` for all non-existent routes
- The `_routes.json` file configures which assets are served as static files vs routing fallbacks
- Client-side routing handles navigation between pages

## Troubleshooting

**404 on root path:**

- Verify `index.html` exists in the build output
- Check that `_app/` directory and other assets were uploaded
- Ensure `_routes.json` is configured correctly

**SPA routing not working:**

- Check that `_app/` directory is present in build
- Verify static files (CSS, JS) have correct paths
