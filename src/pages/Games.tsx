import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import StarField from '../components/StarField'
import Navbar from '../components/Navbar'
import '../styles/Games.css'

const games = [
  { to: '/games/checkers', icon: '\u26AB', title: 'Checkers', desc: 'Classic checkers against an AI opponent', color: '#e94560' },
  { to: '/games/snake', icon: '\uD83D\uDC0D', title: 'Snake', desc: 'Classic snake game with touch controls', color: '#4ade80' },
  { to: '/games/tetris', icon: '\uD83E\uDDF1', title: 'Tetris', desc: 'Stack blocks and clear lines', color: '#00e5ff' },
  { to: '/games/tictactoe', icon: '\u274C', title: 'Tic-Tac-Toe', desc: 'Play against AI or a friend', color: '#a478e8' },
]

export default function Games() {
  return (
    <>
      <SEO title="Games" description="Browser-based games" />
      <StarField shootingStars nebulaOrbs />
      <Navbar />

      <div className="games-page">
        <section className="games-hero">
          <div className="games-hero-badge">
            <span className="games-hero-dot" />
            {games.length} Games Available
          </div>
          <h1 className="games-hero-title">Arcade</h1>
          <p className="games-hero-sub">Pick a game and play right in your browser.</p>
        </section>

        <div className="games-grid">
          {games.map((g, i) => (
            <Link
              key={g.to}
              to={g.to}
              className="games-card"
              style={{ animationDelay: `${0.1 + i * 0.1}s`, '--card-accent': g.color } as React.CSSProperties}
            >
              <div className="games-card-glow" />
              <div className="games-card-inner">
                <span className="games-icon">{g.icon}</span>
                <div className="games-info">
                  <div className="games-title">{g.title}</div>
                  <div className="games-desc">{g.desc}</div>
                </div>
                <span className="games-arrow">&rsaquo;</span>
              </div>
              <div className="games-card-shine" />
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
