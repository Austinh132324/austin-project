# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Austin's mobile app playground — a collection of fun little web apps accessible from a phone. Deployed to **https://austinshowell.dev** via GitHub Pages.

## Architecture

```
public/
├── index.html        # Main app entry point
├── manifest.json     # PWA manifest for mobile add-to-home-screen
└── CNAME             # Custom domain config
.github/
└── workflows/
    └── deploy-dev.yml  # GitHub Actions deploy on merge to main
```

### Adding new apps

1. Create a new directory under `public/` (e.g., `public/my-cool-app/`)
2. Add an `index.html` inside it
3. Link to it from the main `public/index.html`
4. Merge PR into `main` — it auto-deploys

## Deployment

### Production

- **Trigger:** Push/merge to `main` branch, or manual `workflow_dispatch`
- **Workflow:** `.github/workflows/deploy-dev.yml`
- **URL:** https://austinshowell.dev
- **Platform:** GitHub Pages

### Adding new environments

1. Create a new workflow file (e.g., `deploy-staging.yml`)
2. Set the trigger branch and environment name
3. Configure DNS if using a different subdomain

## Custom Domain Setup

The domain `austinshowell.dev` requires DNS configuration:

1. Go to your domain registrar
2. Add an **A record** pointing to GitHub Pages IPs:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
3. Optionally add a **CNAME** record: `www` → `Austinh132324.github.io`
4. In GitHub repo Settings > Pages, set the custom domain to `austinshowell.dev` and enable HTTPS

## Repository Details

- **Remote:** https://github.com/Austinh132324/Howell-Tech-Platform.git
- **Domain:** https://austinshowell.dev
