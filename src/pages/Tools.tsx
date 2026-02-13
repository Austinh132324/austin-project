import { Link } from 'react-router-dom'
import '../styles/Tools.css'

const tools = [
  { to: '/tools/pomodoro', icon: '\u23F1', title: 'Pomodoro Timer', desc: 'Focus timer with work and break sessions' },
  { to: '/tools/markdown', icon: '\u270E', title: 'Markdown Preview', desc: 'Live markdown editor and previewer' },
  { to: '/tools/colors', icon: '\uD83C\uDFA8', title: 'Color Palette', desc: 'Generate harmonious color palettes' },
  { to: '/tools/visualizer', icon: '\uD83C\uDFB5', title: 'Music Visualizer', desc: 'Visualize audio with canvas animations' },
  { to: '/tools/nba', icon: '\uD83C\uDFC0', title: 'NBA Command Center', desc: 'Live scores, player tracking, and group stats' },
]

export default function Tools() {
  return (
    <div className="tools-page">
      <Link to="/" className="tools-back-link">&larr; Back</Link>
      <h1>Tools</h1>
      <p className="tools-subtitle">Handy utilities built right in the browser.</p>
      <div className="tools-grid">
        {tools.map(t => (
          <Link key={t.to} to={t.to} className="tools-card">
            <span className="tools-icon">{t.icon}</span>
            <div className="tools-info">
              <div className="tools-title">{t.title}</div>
              <div className="tools-desc">{t.desc}</div>
            </div>
            <span className="tools-arrow">&rsaquo;</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
