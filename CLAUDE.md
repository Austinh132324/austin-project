# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Austin's personal tech platform — a React/TypeScript SPA with games, tools, and portfolio. Deployed to **https://austinshowell.dev** via GitHub Pages.

## Architecture

- **Framework:** React 18 + React Router v6 (HashRouter)
- **Build tool:** Vite + TypeScript
- **Testing:** Vitest + React Testing Library

```
index.html                # Vite entry point (loads src/main.tsx)
src/
├── main.tsx              # App entry (ThemeProvider wrapper)
├── App.tsx               # HashRouter with all routes
├── components/           # Shared components (Navbar, Footer, Ethan, StarField, Leaderboard)
├── pages/                # Page components (Home, Games, Tools, etc.)
├── lib/utils/            # Utilities (theme, leaderboard, matchResponse)
└── styles/               # CSS files
public/
├── CNAME                 # Custom domain: austinshowell.dev
├── manifest.json         # PWA manifest
├── sw.js                 # Service worker
└── icons/                # PWA icons
tests/                    # Vitest test files
.github/
└── workflows/
    └── deploy-dev.yml    # GitHub Actions deploy on merge to main
```

### Adding new pages

1. Create a new component in `src/pages/`
2. Add a route in `src/App.tsx`
3. Add corresponding CSS in `src/styles/`
4. Link to it from the appropriate hub page (Home, Games, Tools)
5. Merge PR into `main` — it auto-deploys

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run test      # Run tests (vitest)
npm run lint      # ESLint check
```

## Deployment

### Production

- **Trigger:** Push/merge to `main` branch, or manual `workflow_dispatch`
- **Workflow:** `.github/workflows/deploy-dev.yml`
- **URL:** https://austinshowell.dev
- **Platform:** GitHub Pages (deploys `dist/` via actions/deploy-pages)

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

- **Remote:** https://github.com/Austinh132324/austin-project.git
- **Domain:** https://austinshowell.dev
