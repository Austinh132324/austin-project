import { Link } from 'react-router-dom'
import StarField from '../components/StarField'
import Navbar from '../components/Navbar'
import '../styles/Tools.css'

const tools = [
  { to: '/tools/pomodoro', icon: '\u23F1', title: 'Pomodoro Timer', desc: 'Focus timer with work and break sessions', color: '#e94560' },
  { to: '/tools/markdown', icon: '\u270E', title: 'Markdown Preview', desc: 'Live markdown editor and previewer', color: '#a478e8' },
  { to: '/tools/colors', icon: '\uD83C\uDFA8', title: 'Color Palette', desc: 'Generate harmonious color palettes', color: '#00e5ff' },
  { to: '/tools/visualizer', icon: '\uD83C\uDFB5', title: 'Music Visualizer', desc: 'Visualize audio with canvas animations', color: '#4ade80' },
  { to: '/tools/nba', icon: '\uD83C\uDFC0', title: 'NBA Command Center', desc: 'Live scores, odds, player props, and group stats', color: '#f59e0b' },
  { to: '/tools/mlb', icon: '\u26BE', title: 'MLB Command Center', desc: 'Live scores, odds, player props, and group stats', color: '#2563eb' },
  { to: '/portal/login', icon: '\uD83D\uDD12', title: 'Portal', desc: 'Admin login and site management', color: '#f472b6' },
]

export default function Tools() {
  return (
    <>
      <StarField shootingStars nebulaOrbs />
      <Navbar />

      <div className="tools-page">
        <section className="tools-hero">
          <div className="tools-hero-badge">
            <span className="tools-hero-dot" />
            {tools.length} Tools Available
          </div>
          <h1 className="tools-hero-title">Mission Control</h1>
          <p className="tools-hero-sub">Handy utilities built right in the browser.</p>
        </section>

        <div className="tools-grid">
          {tools.map((t, i) => (
            <Link
              key={t.to}
              to={t.to}
              className="tools-card"
              style={{ animationDelay: `${0.1 + i * 0.1}s`, '--card-accent': t.color } as React.CSSProperties}
            >
              <div className="tools-card-glow" />
              <div className="tools-card-inner">
                <span className="tools-icon">{t.icon}</span>
                <div className="tools-info">
                  <div className="tools-title">{t.title}</div>
                  <div className="tools-desc">{t.desc}</div>
                </div>
                <span className="tools-arrow">&rsaquo;</span>
              </div>
              <div className="tools-card-shine" />
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
