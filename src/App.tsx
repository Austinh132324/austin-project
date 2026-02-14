import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import PageTransition from './components/PageTransition'
import Ethan from './components/Ethan'
import Home from './pages/Home'
import AboutMe from './pages/AboutMe'
import Projects from './pages/Projects'
import Games from './pages/Games'
import Checkers from './pages/Checkers'
import Snake from './pages/Snake'
import Tetris from './pages/Tetris'
import TicTacToe from './pages/TicTacToe'
import Tools from './pages/Tools'
import Pomodoro from './pages/Pomodoro'
import MarkdownPreview from './pages/MarkdownPreview'
import ColorPalette from './pages/ColorPalette'
import MusicVisualizer from './pages/MusicVisualizer'
import IOSInstallPrompt from './components/IOSInstallPrompt'
import InstallPrompt from './components/InstallPrompt'
import PortalLogin from './pages/PortalLogin'
import Portal from './pages/Portal'
import ProtectedRoute from './components/ProtectedRoute'
import Terminal from './pages/Terminal'
import EthanFarm from './pages/EthanFarm'
import Analytics, { trackPageView, trackClick } from './pages/Analytics'

// Lazy-loaded heavy pages
const NBACommandCenter = lazy(() => import('./pages/NBACommandCenter'))
const MLBCommandCenter = lazy(() => import('./pages/MLBCommandCenter'))
const NFLCommandCenter = lazy(() => import('./pages/NFLCommandCenter'))

function LazyFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p>Loading...</p>
      </div>
    </div>
  )
}

function PageTracker() {
  const location = useLocation()
  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])
  return null
}

function ClickTracker() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Skip clicks inside the analytics dashboard to avoid self-tracking
      if (target.closest('.pbi-dashboard')) return
      const link = target.closest('a, button')
      if (link) {
        const label = link.textContent?.trim().slice(0, 50) || link.tagName
        trackClick(label)
      }
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/aboutme" element={<PageTransition><AboutMe /></PageTransition>} />
        <Route path="/projects" element={<PageTransition><Projects /></PageTransition>} />
        <Route path="/games" element={<PageTransition><Games /></PageTransition>} />
        <Route path="/games/checkers" element={<PageTransition><Checkers /></PageTransition>} />
        <Route path="/games/snake" element={<PageTransition><Snake /></PageTransition>} />
        <Route path="/games/tetris" element={<PageTransition><Tetris /></PageTransition>} />
        <Route path="/games/tictactoe" element={<PageTransition><TicTacToe /></PageTransition>} />
        <Route path="/tools" element={<PageTransition><Tools /></PageTransition>} />
        <Route path="/tools/pomodoro" element={<PageTransition><Pomodoro /></PageTransition>} />
        <Route path="/tools/markdown" element={<PageTransition><MarkdownPreview /></PageTransition>} />
        <Route path="/tools/colors" element={<PageTransition><ColorPalette /></PageTransition>} />
        <Route path="/tools/visualizer" element={<PageTransition><MusicVisualizer /></PageTransition>} />
        <Route path="/tools/nba" element={<PageTransition><Suspense fallback={<LazyFallback />}><NBACommandCenter /></Suspense></PageTransition>} />
        <Route path="/tools/mlb" element={<PageTransition><Suspense fallback={<LazyFallback />}><MLBCommandCenter /></Suspense></PageTransition>} />
        <Route path="/tools/nfl" element={<PageTransition><Suspense fallback={<LazyFallback />}><NFLCommandCenter /></Suspense></PageTransition>} />
        <Route path="/portal/login" element={<PageTransition><PortalLogin /></PageTransition>} />
        <Route path="/portal" element={<PageTransition><ProtectedRoute><Portal /></ProtectedRoute></PageTransition>} />
        <Route path="/terminal" element={<PageTransition><Terminal /></PageTransition>} />
        <Route path="/ethan-farm" element={<PageTransition><EthanFarm /></PageTransition>} />
        <Route path="/analytics" element={<PageTransition><Analytics /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <HashRouter>
      <PageTracker />
      <ClickTracker />
      <IOSInstallPrompt />
      <InstallPrompt />
      <Ethan />
      <AnimatedRoutes />
    </HashRouter>
  )
}
