import { useState, useEffect } from 'react'
import './IOSInstallPrompt.css'

const DISMISSED_KEY = 'ios-install-dismissed'

function isIOS(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isInStandaloneMode(): boolean {
  return ('standalone' in window.navigator && (window.navigator as any).standalone === true)
    || window.matchMedia('(display-mode: standalone)').matches
}

export default function IOSInstallPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isIOS()) return
    if (isInStandaloneMode()) return
    if (localStorage.getItem(DISMISSED_KEY)) return
    // Small delay so it doesn't flash on load
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  const dismiss = () => {
    setShow(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  return (
    <div className="ios-prompt-overlay">
      <div className="ios-prompt">
        <button className="ios-prompt-close" onClick={dismiss}>&times;</button>
        <div className="ios-prompt-icon">📱</div>
        <h3 className="ios-prompt-title">Install this App</h3>
        <p className="ios-prompt-text">
          Tap the <span className="ios-prompt-share">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </span> Share button, then <strong>"Add to Home Screen"</strong> for the full app experience.
        </p>
        <button className="ios-prompt-dismiss" onClick={dismiss}>Got it</button>
      </div>
    </div>
  )
}
