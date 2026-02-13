# Implementation Plan: Howell-Tech-Platform Feature Expansion

This plan covers 14 new features organized into 6 phases, ordered by dependency and complexity.

---

## Phase 1: Foundation & Quick Wins
*Theme switcher, resume download, live project demos — sets up shared infrastructure*

### 1A. Theme Switcher
**Files to create:**
- `src/lib/utils/theme.ts` — Theme context provider + hook (`useTheme`)
- `src/styles/themes.css` — CSS custom properties for dark/light/custom themes

**Files to modify:**
- `src/main.tsx` — Wrap `<App>` in `<ThemeProvider>`
- `src/styles/global.css` — Convert hardcoded colors (`#0b0b1a`, `#e94560`, `#533483`, etc.) to CSS variables (`--bg-primary`, `--accent-red`, `--accent-purple`, etc.)
- `src/styles/Home.css`, `AboutMe.css`, `Projects.css`, `Games.css`, `Checkers.css`, `Navbar.css`, `Footer.css` — Replace all hardcoded color values with CSS variables
- `src/components/Navbar.tsx` — Add theme toggle button (sun/moon icon)
- `src/components/Navbar.css` — Style the toggle

**Approach:**
- Use React context + `localStorage` persistence
- Define 2 themes: dark (current) and light
- CSS variables on `:root` / `[data-theme="light"]` selectors
- StarField adapts density/colors based on theme
- Transition: `transition: background-color 0.3s, color 0.3s` on body

**Tests to add:**
- `tests/theme.test.ts` — Theme toggle, localStorage persistence, default theme

---

### 1B. Resume PDF Download
**Files to create:**
- `public/Austin_Howell_Resume.pdf` — The actual resume PDF

**Files to modify:**
- `src/pages/AboutMe.tsx` — Add a download button in the hero/header area

**Approach:**
- Simple `<a href="/Austin_Howell_Resume.pdf" download>` button
- Style as a prominent CTA button matching the site's aesthetic
- No JS library needed — just a static file serve

**Tests to add:**
- `tests/AboutMe.test.tsx` — Verify download link renders with correct href and download attribute

---

### 1C. Live Project Demos
**Files to modify:**
- `src/pages/Projects.tsx` — Add screenshot images and "Live Demo" / "Source" links to each project card

**Files to create:**
- `public/screenshots/` — Directory for project screenshot images (one per project)

**Approach:**
- Add `image`, `demoUrl`, and `sourceUrl` fields to the existing projects array in `Projects.tsx`
- Render images as card headers with lazy loading (`loading="lazy"`)
- "Live Demo" opens in new tab, "Source" links to GitHub
- Fallback gradient if image fails to load

**Tests to add:**
- `tests/Projects.test.tsx` — Verify project cards render with images and links

---

## Phase 2: Mini Tools
*Pomodoro timer, markdown previewer, color palette generator — standalone pages*

### 2A. Pomodoro Timer
**Files to create:**
- `src/pages/Pomodoro.tsx` — Timer page component
- `src/styles/Pomodoro.css` — Styling
- `tests/Pomodoro.test.tsx` — Unit tests

**Files to modify:**
- `src/App.tsx` — Add route `/tools/pomodoro`
- `src/pages/Home.tsx` — Add a "Tools" card to the home cards grid (or create a Tools hub)

**Approach:**
- Modes: Work (25min), Short Break (5min), Long Break (15min) — configurable
- Circular SVG progress ring for visual countdown
- Audio notification on timer complete (use Web Audio API for a simple beep — no audio files needed)
- Session counter tracking completed pomodoros
- Start/Pause/Reset controls
- State via `useReducer` for clean timer logic
- `localStorage` to persist session count across visits

**Tests to add:**
- Timer state transitions (work → break → work)
- Pause/resume behavior
- Session count increment on completion

---

### 2B. Markdown Previewer
**Files to create:**
- `src/pages/MarkdownPreview.tsx` — Split-pane editor + preview
- `src/styles/MarkdownPreview.css` — Styling
- `tests/MarkdownPreview.test.tsx` — Unit tests

**Files to modify:**
- `src/App.tsx` — Add route `/tools/markdown`

**Approach:**
- Left pane: `<textarea>` with monospace font
- Right pane: Rendered HTML output
- Use a lightweight markdown parser — implement a simple one in `src/lib/utils/markdown.ts` that handles: headings, bold, italic, code blocks, links, lists, blockquotes
- OR install `marked` (~5KB gzipped) as a dependency
- Copy-rendered-HTML button
- Sample markdown pre-loaded on first visit
- Responsive: stack vertically on mobile

**Tests to add:**
- `tests/markdown.test.ts` — Parsing headings, bold, italic, code, links, lists
- Component renders and updates preview on input

---

### 2C. Color Palette Generator
**Files to create:**
- `src/pages/ColorPalette.tsx` — Palette generator page
- `src/styles/ColorPalette.css` — Styling
- `src/lib/utils/colors.ts` — Color generation utilities
- `tests/colors.test.ts` — Color utility tests
- `tests/ColorPalette.test.tsx` — Component tests

**Files to modify:**
- `src/App.tsx` — Add route `/tools/colors`

**Approach:**
- Generate 5-color harmonious palettes using HSL color space
- Harmony modes: analogous, complementary, triadic, split-complementary, random
- Lock individual colors and regenerate the rest
- Click a color swatch to copy hex/rgb to clipboard (`navigator.clipboard.writeText`)
- "Generate" button + spacebar shortcut for new palette
- Export palette as CSS variables or Tailwind config snippet
- Color utility functions: HSL↔RGB↔Hex conversions, contrast ratio calculation

**Tests to add:**
- Color conversion accuracy (HSL→RGB→Hex roundtrip)
- Palette generation produces correct count
- Harmony modes produce expected hue relationships

---

### 2D. Tools Hub Page
**Files to create:**
- `src/pages/Tools.tsx` — Hub listing all mini tools
- `src/styles/Tools.css` — Styling (reuse Games.css pattern)

**Files to modify:**
- `src/App.tsx` — Add route `/tools`
- `src/pages/Home.tsx` — Add "Tools" card alongside About Me, Projects, Games

**Approach:**
- Same card-grid pattern as Games.tsx
- Cards for: Pomodoro, Markdown Previewer, Color Palette
- Each links to `/tools/<name>`

---

## Phase 3: More Games
*Snake, Tetris, Tic-Tac-Toe — follow the Checkers canvas pattern*

### 3A. Snake Game
**Files to create:**
- `src/pages/Snake.tsx` — Full snake game
- `src/styles/Snake.css` — Styling
- `tests/Snake.test.ts` — Game logic unit tests

**Files to modify:**
- `src/App.tsx` — Add route `/games/snake`
- `src/pages/Games.tsx` — Add Snake to the games array

**Approach:**
- Canvas-based rendering (same pattern as Checkers)
- Game loop via `requestAnimationFrame` with fixed timestep
- Touch controls: swipe detection for mobile + arrow keys for desktop
- On-screen D-pad for mobile
- Speed increases as score grows
- Pause/resume with spacebar
- Game over screen with score + restart button
- Extract game logic (board state, collision detection, food spawning) into pure functions for testability

**Tests to add:**
- Snake movement in all 4 directions
- Collision detection (wall + self)
- Food spawning on empty cells
- Score increment on food consumption
- Growth mechanics

---

### 3B. Tetris Game
**Files to create:**
- `src/pages/Tetris.tsx` — Full Tetris game
- `src/styles/Tetris.css` — Styling
- `src/lib/utils/tetris.ts` — Pure game logic (board, pieces, rotation, collision)
- `tests/tetris.test.ts` — Game logic unit tests

**Files to modify:**
- `src/App.tsx` — Add route `/games/tetris`
- `src/pages/Games.tsx` — Add Tetris to games array

**Approach:**
- Canvas-based rendering
- 7 standard tetrominoes (I, O, T, S, Z, J, L) with SRS rotation system
- Ghost piece showing drop position
- Next piece preview + hold piece
- Scoring: single/double/triple/tetris line clears with combo multiplier
- Increasing speed per level (10 lines = 1 level)
- Touch: tap to rotate, swipe left/right to move, swipe down for soft drop, swipe up for hard drop
- Game logic in pure functions for testing

**Tests to add:**
- Piece rotation (all 7 pieces, all rotation states)
- Collision detection (wall kicks, floor, other pieces)
- Line clear detection and removal
- Scoring calculation
- Level progression

---

### 3C. Tic-Tac-Toe (with Multiplayer prep)
**Files to create:**
- `src/pages/TicTacToe.tsx` — Game with local 2-player and AI modes
- `src/styles/TicTacToe.css` — Styling
- `src/lib/utils/tictactoe.ts` — Game logic (board, win check, minimax AI)
- `tests/tictactoe.test.ts` — Logic tests

**Files to modify:**
- `src/App.tsx` — Add route `/games/tictactoe`
- `src/pages/Games.tsx` — Add to games array

**Approach:**
- 3 modes: vs AI (unbeatable minimax), local 2-player, online multiplayer (Phase 5)
- CSS Grid-based board (simpler than canvas for this game)
- Win line animation (SVG line drawn through winning 3)
- Score tracking across rounds
- AI difficulty: easy (random), medium (random + block wins), hard (minimax)

**Tests to add:**
- Win detection (rows, columns, diagonals)
- Draw detection
- Minimax returns optimal move
- AI blocks opponent wins

---

## Phase 4: Leaderboard & PWA
*Shared leaderboard system, service worker for offline play*

### 4A. Leaderboard System
**Files to create:**
- `src/lib/utils/leaderboard.ts` — Leaderboard CRUD utilities
- `src/components/Leaderboard.tsx` — Reusable leaderboard display component
- `src/styles/Leaderboard.css` — Styling
- `tests/leaderboard.test.ts` — Storage utility tests
- `tests/Leaderboard.test.tsx` — Component tests

**Files to modify:**
- `src/pages/Snake.tsx` — Save high scores on game over, show leaderboard
- `src/pages/Tetris.tsx` — Same integration
- `src/pages/Checkers.tsx` — Track wins/losses

**Approach:**
- `localStorage`-based for now (no backend needed)
- Data structure: `{ game: string, name: string, score: number, date: string }[]`
- Top 10 scores per game
- Name entry prompt on new high score
- Leaderboard component shows rank, name, score, date
- Sortable by score
- Future: swap localStorage for Firebase/Supabase backend without changing component

**Tests to add:**
- Score saving and retrieval
- Top-10 limit enforcement
- Sorting correctness
- Score insertion at correct position

---

### 4B. PWA Offline Mode
**Files to create:**
- `public/sw.js` — Service worker with caching strategies
- `public/icons/` — PWA icons at required sizes (192x192, 512x512)

**Files to modify:**
- `index.html` — Add service worker registration script
- `public/manifest.json` — Add icons array, `scope`, `theme_color`, `orientation`
- `vite.config.ts` — Potentially use `vite-plugin-pwa` for automatic SW generation, OR keep manual SW

**Approach:**
- **Cache-first** strategy for static assets (JS, CSS, images, fonts)
- **Network-first** strategy for HTML (to get latest content when online)
- Pre-cache the app shell on install
- Offline fallback page if not cached
- Games work fully offline (all client-side)
- Generate PNG icons from the "AH" avatar design (can create programmatically with canvas or use simple SVG→PNG)

**Service Worker Lifecycle:**
```
install  → Pre-cache app shell + static assets
activate → Clean up old caches
fetch    → Cache-first for assets, network-first for navigation
```

**Tests to add:**
- Service worker registration test
- Manifest validation (icons, display, etc.)

---

## Phase 5: Interactive Experiences
*Terminal emulator, music visualizer, multiplayer*

### 5A. Terminal Emulator
**Files to create:**
- `src/pages/Terminal.tsx` — Terminal page component
- `src/styles/Terminal.css` — Green-on-black terminal styling
- `src/lib/utils/terminal.ts` — Command parser and executor
- `tests/terminal.test.ts` — Command parsing tests
- `tests/Terminal.test.tsx` — Component tests

**Files to modify:**
- `src/App.tsx` — Add route `/terminal`
- `src/pages/Home.tsx` — Add as a navigable feature (or Easter egg via keyboard shortcut)

**Approach:**
- Classic terminal look: monospace font, green/amber text on dark background, blinking cursor
- Command history (up/down arrows)
- Available commands:
  - `help` — List all commands
  - `about` — Display bio
  - `skills` — List tech stack
  - `experience` — Show work history
  - `education` — Show education
  - `projects` — List projects
  - `games` — Navigate to games
  - `contact` — Show contact info
  - `clear` — Clear terminal
  - `theme [dark|light]` — Switch theme
  - `neofetch` — Display system-style info card (ASCII art + stats)
  - `cd <page>` — Navigate to a page
  - `ls` — List available "directories" (pages)
  - `cat resume` — Display resume text
- Tab completion for commands
- Reuse data from `matchResponse.ts` knowledge base where applicable
- Typing animation for output (optional, with `--no-animation` flag)

**Tests to add:**
- Command parsing for each command
- Unknown command fallback
- History navigation
- Tab completion logic

---

### 5B. Music Visualizer
**Files to create:**
- `src/pages/MusicVisualizer.tsx` — Visualizer page
- `src/styles/MusicVisualizer.css` — Styling
- `tests/MusicVisualizer.test.tsx` — Component tests

**Files to modify:**
- `src/App.tsx` — Add route `/tools/visualizer`
- `src/pages/Tools.tsx` — Add to tools listing

**Approach:**
- Use **Web Audio API** (`AudioContext`, `AnalyserNode`)
- Input sources:
  - Microphone input (`getUserMedia`) for live audio
  - File upload (`<input type="file" accept="audio/*">`)
- Visualization modes:
  - Frequency bars (classic equalizer)
  - Waveform (oscilloscope)
  - Circular radial visualization
  - Particle burst (particles react to bass/treble)
- Canvas-based rendering (leveraging StarField patterns)
- Color scheme matches site theme (reds, purples)
- Full-screen toggle
- Sensitivity/smoothing controls

**Tests to add:**
- Component renders without audio source
- Mode switching works
- Controls update visualization parameters

---

### 5C. Multiplayer (WebSocket Tic-Tac-Toe)
**Files to create:**
- `src/lib/utils/multiplayer.ts` — WebSocket connection manager
- Modify `src/pages/TicTacToe.tsx` — Add online mode

**Approach:**
- Use a free WebSocket relay service (e.g., PeerJS for WebRTC peer-to-peer, or a simple room-code system)
- **Room-based matchmaking:** Player 1 creates room → gets 4-digit code → Player 2 enters code to join
- Since this is a static site (no backend), use **WebRTC DataChannel** via PeerJS:
  - No server needed for game state exchange
  - PeerJS provides the signaling server for free
  - Install `peerjs` package
- Game state synced on each move
- Reconnection handling
- Turn indicator showing who plays next

**Alternative (simpler):** Use **BroadcastChannel API** for same-device multiplayer (two browser tabs) as an MVP, then upgrade to PeerJS.

**Tests to add:**
- Game state serialization/deserialization
- Move validation (correct turn, valid cell)
- Win detection over network state

---

## Phase 6: AI & Analytics
*Real AI chatbot, analytics dashboard*

### 6A. Real AI Chatbot
**Files to create:**
- `src/lib/utils/aiChat.ts` — API client for LLM calls

**Files to modify:**
- `src/pages/Home.tsx` — Replace `matchResponse` call with AI API call (with fallback to regex)

**Approach:**
- **Option A (Recommended): Client-side API call**
  - Use Anthropic's Claude API or OpenAI API
  - API key stored as env variable, proxied through a small serverless function (Cloudflare Worker or Vercel Edge Function) to avoid exposing the key
  - System prompt includes the full resume/knowledge base as context
  - Streaming responses for real-time feel

- **Option B: Free-tier fallback**
  - Keep `matchResponse` as fallback when API is unavailable
  - Rate limit: X requests per session to control costs

- **Conversation context:** Send last 5 messages as conversation history for continuity
- **Loading state:** Show typing indicator during API call
- **Error handling:** Fall back to regex `matchResponse` on API failure

**Infrastructure needed:**
- A serverless function endpoint (1 small file deployed separately)
- API key stored as a secret in the serverless platform
- CORS configured to only accept requests from `austinshowell.dev`

**Tests to add:**
- `tests/aiChat.test.ts` — API client with mocked fetch (success, error, timeout scenarios)
- Fallback to regex matcher on API failure

---

### 6B. Analytics Dashboard
**Files to create:**
- `src/pages/Analytics.tsx` — Dashboard page
- `src/styles/Analytics.css` — Styling
- `src/lib/utils/analytics.ts` — Analytics tracking + retrieval utilities
- `tests/analytics.test.ts` — Utility tests

**Files to modify:**
- `src/App.tsx` — Add route `/analytics` (could be hidden/unlisted)
- `src/main.tsx` or `src/App.tsx` — Add analytics event tracking on route changes

**Approach:**
- **Client-side only (localStorage):**
  - Track page views per route
  - Track game plays and scores
  - Track chat questions asked (categories from matchResponse)
  - Track time spent per page

- **Dashboard displays:**
  - Page view bar chart (canvas or SVG)
  - Most popular games pie chart
  - Chat topic distribution
  - Visit timeline (last 30 days)
  - Total stats cards (visits, games played, chat messages)

- Charts built with canvas (no charting library needed — keep it lightweight, or install `chart.js` if preferred)
- Data persists in localStorage, scoped per-device
- Reset button to clear analytics

**Future upgrade path:** Swap localStorage for Plausible/Umami/custom backend for cross-device analytics

**Tests to add:**
- Event tracking stores correctly
- Aggregation functions (daily counts, category totals)
- Dashboard renders with empty data gracefully

---

## Route Summary

After all phases, the route structure will be:

```
/                        → Home (updated with Tools card)
/aboutme                 → About Me (+ resume download)
/projects                → Projects (+ live demos)
/games                   → Games hub
/games/checkers          → Checkers (+ leaderboard)
/games/snake             → Snake (new)
/games/tetris            → Tetris (new)
/games/tictactoe         → Tic-Tac-Toe (new, + multiplayer)
/tools                   → Tools hub (new)
/tools/pomodoro          → Pomodoro Timer (new)
/tools/markdown          → Markdown Previewer (new)
/tools/colors            → Color Palette Generator (new)
/tools/visualizer        → Music Visualizer (new)
/terminal                → Terminal Emulator (new)
/analytics               → Analytics Dashboard (new)
```

## New Dependencies

| Package | Purpose | Phase |
|---------|---------|-------|
| `marked` (optional) | Markdown parsing | 2B |
| `peerjs` | WebRTC multiplayer | 5C |

All other features use **zero additional dependencies** — built with React, Canvas API, Web Audio API, Web APIs, and CSS.

## Test Coverage Target

Each new feature includes dedicated tests. Estimated new test count:
- Phase 1: ~15 tests (theme, about me, projects)
- Phase 2: ~35 tests (pomodoro, markdown, colors, tools hub)
- Phase 3: ~40 tests (snake, tetris, tic-tac-toe game logic)
- Phase 4: ~15 tests (leaderboard, PWA)
- Phase 5: ~25 tests (terminal commands, visualizer, multiplayer)
- Phase 6: ~20 tests (AI chat client, analytics)

**Total: ~150 new tests** on top of the existing 49.

## CI/CD Impact

No changes needed to the deploy pipeline — the existing `quality` gate (lint + test → deploy) will automatically enforce quality for all new code. New ESLint plugins (`react`, `react-hooks`) already cover React patterns used in new components.
