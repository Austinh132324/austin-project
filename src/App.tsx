import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
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
import NBACommandCenter from './pages/NBACommandCenter'
import Terminal from './pages/Terminal'
import EthanFarm from './pages/EthanFarm'
import Analytics, { trackPageView } from './pages/Analytics'

function PageTracker() {
  const location = useLocation()
  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])
  return null
}

export default function App() {
  return (
    <HashRouter>
      <PageTracker />
      <Ethan />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aboutme" element={<AboutMe />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/checkers" element={<Checkers />} />
        <Route path="/games/snake" element={<Snake />} />
        <Route path="/games/tetris" element={<Tetris />} />
        <Route path="/games/tictactoe" element={<TicTacToe />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/tools/pomodoro" element={<Pomodoro />} />
        <Route path="/tools/markdown" element={<MarkdownPreview />} />
        <Route path="/tools/colors" element={<ColorPalette />} />
        <Route path="/tools/visualizer" element={<MusicVisualizer />} />
        <Route path="/tools/nba" element={<NBACommandCenter />} />
        <Route path="/terminal" element={<Terminal />} />
        <Route path="/ethan-farm" element={<EthanFarm />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </HashRouter>
  )
}
