import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { isAuthenticated, logout, getSessionEmail } from '../lib/utils/auth'
import '../styles/Portal.css'

interface QuickLink {
  icon: string
  label: string
  to: string
  color: string
}

const quickLinks: QuickLink[] = [
  { icon: '📊', label: 'Analytics', to: '/analytics', color: '#e94560' },
  { icon: '🏀', label: 'NBA Command Center', to: '/tools/nba', color: '#f59e0b' },
  { icon: '⚾', label: 'MLB Command Center', to: '/tools/mlb', color: '#2563eb' },
  { icon: '🎮', label: 'Games', to: '/games', color: '#4ade80' },
  { icon: '🛠', label: 'Tools', to: '/tools', color: '#a478e8' },
  { icon: '💻', label: 'Terminal', to: '/terminal', color: '#00e5ff' },
]

export default function Portal() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/portal/login', { replace: true })
      return
    }
    setEmail(getSessionEmail())
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/portal/login', { replace: true })
  }

  if (!email) return null

  return (
    <div className="portal-page">
      <div className="portal-top-bar">
        <Link to="/tools" className="portal-back-link">&larr; Tools</Link>
        <button className="portal-logout-btn" onClick={handleLogout}>Sign Out</button>
      </div>

      <div className="portal-hero">
        <div className="portal-avatar">
          <span>{email.charAt(0).toUpperCase()}</span>
        </div>
        <h1 className="portal-welcome">Welcome back</h1>
        <p className="portal-email">{email}</p>
      </div>

      <section className="portal-section">
        <h2 className="portal-section-title">Quick Links</h2>
        <div className="portal-links-grid">
          {quickLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="portal-link-card"
              style={{ '--link-accent': link.color } as React.CSSProperties}
            >
              <span className="portal-link-icon">{link.icon}</span>
              <span className="portal-link-label">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="portal-section">
        <h2 className="portal-section-title">Site Management</h2>
        <div className="portal-manage-grid">
          <div className="portal-manage-card">
            <div className="portal-manage-header">
              <span className="portal-manage-icon">📝</span>
              <h3>Content</h3>
            </div>
            <p className="portal-manage-desc">Manage pages, projects, and site content.</p>
            <span className="portal-manage-badge">Coming Soon</span>
          </div>
          <div className="portal-manage-card">
            <div className="portal-manage-header">
              <span className="portal-manage-icon">👤</span>
              <h3>Account</h3>
            </div>
            <p className="portal-manage-desc">Update credentials and profile settings.</p>
            <span className="portal-manage-badge">Coming Soon</span>
          </div>
          <div className="portal-manage-card">
            <div className="portal-manage-header">
              <span className="portal-manage-icon">🎨</span>
              <h3>Appearance</h3>
            </div>
            <p className="portal-manage-desc">Theme, layout, and customization options.</p>
            <span className="portal-manage-badge">Coming Soon</span>
          </div>
          <div className="portal-manage-card">
            <div className="portal-manage-header">
              <span className="portal-manage-icon">🔔</span>
              <h3>Notifications</h3>
            </div>
            <p className="portal-manage-desc">Configure alerts and notification preferences.</p>
            <span className="portal-manage-badge">Coming Soon</span>
          </div>
        </div>
      </section>
    </div>
  )
}
