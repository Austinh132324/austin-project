import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import StarField from '../components/StarField'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import { isAuthenticated, logout, getSessionEmail, getSessionRole, hasPermission, type UserRole } from '../lib/utils/auth'
import '../styles/Portal.css'

interface QuickLink {
  icon: string
  label: string
  to: string
  color: string
}

const quickLinks: QuickLink[] = [
  { icon: '\uD83D\uDCCA', label: 'Analytics', to: '/analytics', color: '#e94560' },
  { icon: '\uD83C\uDFC0', label: 'NBA Command Center', to: '/tools/nba', color: '#f59e0b' },
  { icon: '\u26BE', label: 'MLB Command Center', to: '/tools/mlb', color: '#2563eb' },
  { icon: '\uD83C\uDFC8', label: 'NFL Command Center', to: '/tools/nfl', color: '#4ade80' },
  { icon: '\uD83C\uDFAE', label: 'Games', to: '/games', color: '#a478e8' },
  { icon: '\uD83D\uDCBB', label: 'Terminal', to: '/terminal', color: '#00e5ff' },
]

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  editor: 'Editor',
  viewer: 'Viewer',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#e94560',
  editor: '#f59e0b',
  viewer: '#3b82f6',
}

// Portal manage sections as expandable panels
interface ManageSection {
  id: string
  icon: string
  title: string
  desc: string
  requiredRole: UserRole
}

const manageSections: ManageSection[] = [
  { id: 'content', icon: '\uD83D\uDCDD', title: 'Content', desc: 'Manage pages, projects, and site content.', requiredRole: 'editor' },
  { id: 'account', icon: '\uD83D\uDC64', title: 'Account', desc: 'Update credentials and profile settings.', requiredRole: 'viewer' },
  { id: 'appearance', icon: '\uD83C\uDFA8', title: 'Appearance', desc: 'Theme, layout, and customization options.', requiredRole: 'editor' },
  { id: 'notifications', icon: '\uD83D\uDD14', title: 'Notifications', desc: 'Configure alerts and notification preferences.', requiredRole: 'viewer' },
]

export default function Portal() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole>('viewer')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Content management state
  const [contentItems, setContentItems] = useState<{ id: string; title: string; status: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('portal-content') || '[]') } catch { return [] }
  })
  const [newContentTitle, setNewContentTitle] = useState('')

  // Notification settings state
  const [notifSettings, setNotifSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('portal-notifs') || '{}') } catch { return {} }
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/portal/login', { replace: true })
      return
    }
    setEmail(getSessionEmail())
    setRole(getSessionRole())
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/portal/login', { replace: true })
  }

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id)
  }

  const addContentItem = () => {
    if (!newContentTitle.trim()) return
    const updated = [...contentItems, { id: Date.now().toString(), title: newContentTitle.trim(), status: 'draft' }]
    setContentItems(updated)
    localStorage.setItem('portal-content', JSON.stringify(updated))
    setNewContentTitle('')
  }

  const deleteContentItem = (id: string) => {
    const updated = contentItems.filter(c => c.id !== id)
    setContentItems(updated)
    localStorage.setItem('portal-content', JSON.stringify(updated))
  }

  const toggleContentStatus = (id: string) => {
    const updated = contentItems.map(c =>
      c.id === id ? { ...c, status: c.status === 'draft' ? 'published' : 'draft' } : c
    )
    setContentItems(updated)
    localStorage.setItem('portal-content', JSON.stringify(updated))
  }

  const toggleNotif = (key: string) => {
    const updated = { ...notifSettings, [key]: !notifSettings[key] }
    setNotifSettings(updated)
    localStorage.setItem('portal-notifs', JSON.stringify(updated))
  }

  if (!email) return null

  return (
    <>
    <SEO title="Portal" description="Site management dashboard" />
    <StarField shootingStars nebulaOrbs />
    <Navbar />
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
        <span className="portal-role-badge" style={{ background: ROLE_COLORS[role] + '22', color: ROLE_COLORS[role], border: `1px solid ${ROLE_COLORS[role]}44` }}>
          {ROLE_LABELS[role]}
        </span>
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
          {manageSections.map(section => {
            const canAccess = hasPermission(section.requiredRole)
            const isExpanded = expandedSection === section.id

            return (
              <div key={section.id} className={`portal-manage-card ${isExpanded ? 'expanded' : ''} ${!canAccess ? 'locked' : ''}`}>
                <div className="portal-manage-header" onClick={() => canAccess && toggleSection(section.id)} style={{ cursor: canAccess ? 'pointer' : 'default' }}>
                  <span className="portal-manage-icon">{section.icon}</span>
                  <h3>{section.title}</h3>
                  {!canAccess && <span className="portal-manage-badge">Requires {ROLE_LABELS[section.requiredRole]}</span>}
                  {canAccess && <span className="portal-expand-arrow">{isExpanded ? '\u25B2' : '\u25BC'}</span>}
                </div>
                <p className="portal-manage-desc">{section.desc}</p>

                {isExpanded && section.id === 'content' && (
                  <div className="portal-panel">
                    <div className="portal-panel-row">
                      <input
                        className="portal-panel-input"
                        placeholder="New content title..."
                        value={newContentTitle}
                        onChange={e => setNewContentTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addContentItem()}
                      />
                      <button className="portal-panel-btn" onClick={addContentItem}>Add</button>
                    </div>
                    {contentItems.length === 0 && <p className="portal-panel-empty">No content items yet.</p>}
                    {contentItems.map(item => (
                      <div key={item.id} className="portal-content-item">
                        <span className={`portal-content-status ${item.status}`}>{item.status}</span>
                        <span className="portal-content-title">{item.title}</span>
                        <button className="portal-content-toggle" onClick={() => toggleContentStatus(item.id)}>
                          {item.status === 'draft' ? 'Publish' : 'Unpublish'}
                        </button>
                        <button className="portal-content-delete" onClick={() => deleteContentItem(item.id)}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && section.id === 'account' && (
                  <div className="portal-panel">
                    <div className="portal-account-row">
                      <span className="portal-account-label">Email</span>
                      <span className="portal-account-value">{email}</span>
                    </div>
                    <div className="portal-account-row">
                      <span className="portal-account-label">Role</span>
                      <span className="portal-account-value" style={{ color: ROLE_COLORS[role] }}>{ROLE_LABELS[role]}</span>
                    </div>
                    <div className="portal-account-row">
                      <span className="portal-account-label">Session</span>
                      <span className="portal-account-value">Active (24h expiry)</span>
                    </div>
                    <p className="portal-panel-note">Contact an admin to change roles or reset credentials.</p>
                  </div>
                )}

                {isExpanded && section.id === 'appearance' && (
                  <div className="portal-panel">
                    <p className="portal-panel-note">Theme settings are managed globally via the theme toggle in the navbar. Additional layout customization options are planned for a future release.</p>
                    <div className="portal-account-row">
                      <span className="portal-account-label">Current Theme</span>
                      <span className="portal-account-value">Space Dark</span>
                    </div>
                    <div className="portal-account-row">
                      <span className="portal-account-label">StarField</span>
                      <span className="portal-account-value">Enabled</span>
                    </div>
                    <div className="portal-account-row">
                      <span className="portal-account-label">Animations</span>
                      <span className="portal-account-value">Enabled</span>
                    </div>
                  </div>
                )}

                {isExpanded && section.id === 'notifications' && (
                  <div className="portal-panel">
                    {[
                      { key: 'game_alerts', label: 'Game start alerts', desc: 'Get notified when tracked games go live' },
                      { key: 'score_updates', label: 'Score updates', desc: 'Real-time score change notifications' },
                      { key: 'player_milestones', label: 'Player milestones', desc: 'Alerts when tracked players hit stat milestones' },
                      { key: 'site_updates', label: 'Site updates', desc: 'Notifications about new features and changes' },
                    ].map(opt => (
                      <div key={opt.key} className="portal-notif-item">
                        <div className="portal-notif-info">
                          <span className="portal-notif-label">{opt.label}</span>
                          <span className="portal-notif-desc">{opt.desc}</span>
                        </div>
                        <button
                          className={`portal-notif-toggle ${notifSettings[opt.key] ? 'on' : ''}`}
                          onClick={() => toggleNotif(opt.key)}
                          aria-label={`Toggle ${opt.label}`}
                        >
                          <span className="portal-notif-knob" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
    </>
  )
}
