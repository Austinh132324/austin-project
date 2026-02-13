# Austin's Tech Platform

Personal tech platform with games, tools, and portfolio — built with React and deployed to [austinshowell.dev](https://austinshowell.dev) via GitHub Pages.

## What's Inside

**Portfolio**
- Home page with AI chatbot
- About Me
- Projects showcase

**Games**
- Checkers
- Snake
- Tetris
- Tic-Tac-Toe
- Ethan Farm

**Tools**
- Pomodoro Timer
- Markdown Previewer
- Color Palette Generator
- Music Visualizer
- Terminal Emulator

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6 (HashRouter)
- **Build:** Vite
- **Testing:** Vitest + React Testing Library
- **Deployment:** GitHub Pages via GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/Austinh132324/austin-project.git
cd austin-project
npm install
```

### Scripts

| Command            | Description                  |
| ------------------ | ---------------------------- |
| `npm run dev`      | Start local dev server       |
| `npm run build`    | Production build to `dist/`  |
| `npm run preview`  | Preview production build     |
| `npm test`         | Run tests with Vitest        |
| `npm run lint`     | Lint with ESLint             |

## Deployment

Pushes to `main` automatically build and deploy to GitHub Pages via the workflow in `.github/workflows/deploy-dev.yml`.

**Live site:** [austinshowell.dev](https://austinshowell.dev)
