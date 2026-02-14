import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import StarField from '../components/StarField'
import Navbar from '../components/Navbar'
import { login, isAuthenticated } from '../lib/utils/auth'
import '../styles/Portal.css'

export default function PortalLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) navigate('/portal', { replace: true })
  }, [navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Small delay for feel
    setTimeout(() => {
      if (login(email, password)) {
        navigate('/portal', { replace: true })
      } else {
        setError('Invalid email or password.')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <>
    <StarField shootingStars nebulaOrbs />
    <Navbar />
    <div className="portal-login-page">
      <div className="portal-login-bg">
        <div className="portal-login-orb portal-login-orb-1" />
        <div className="portal-login-orb portal-login-orb-2" />
        <div className="portal-login-orb portal-login-orb-3" />
      </div>

      <div className="portal-login-card">
        <Link to="/tools" className="portal-back-link">&larr; Tools</Link>

        <div className="portal-login-header">
          <div className="portal-login-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="portal-login-title">Portal Login</h1>
          <p className="portal-login-sub">Sign in to access the admin portal</p>
        </div>

        <form className="portal-login-form" onSubmit={handleSubmit}>
          <div className="portal-field">
            <label className="portal-label" htmlFor="portal-email">Email</label>
            <input
              id="portal-email"
              type="email"
              className="portal-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="portal-field">
            <label className="portal-label" htmlFor="portal-password">Password</label>
            <input
              id="portal-password"
              type="password"
              className="portal-input"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="portal-error">{error}</div>}

          <button type="submit" className="portal-submit" disabled={loading}>
            {loading ? (
              <span className="portal-submit-loading">
                <span className="portal-spinner-sm" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
    </>
  )
}
