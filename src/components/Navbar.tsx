import { Link } from 'react-router-dom'
import { useTheme } from '../lib/utils/theme'
import '../styles/Navbar.css'

interface NavbarProps {
  links?: { label: string; href: string }[]
}

export default function Navbar({ links }: NavbarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="top-bar" role="navigation" aria-label="Main navigation">
      <Link to="/" aria-label="Go to home page">&larr; Home</Link>
      <div className="nav-right">
        {links && (
          <div className="nav-links">
            {links.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
          </div>
        )}
        <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '\u2600' : '\u263D'}
        </button>
      </div>
    </nav>
  )
}
