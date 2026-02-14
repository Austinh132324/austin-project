import { useState, useEffect } from 'react'
import '../styles/InstallPrompt.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: string }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa-install-dismissed') === 'true')

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const handleInstall = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  return (
    <div className="install-prompt" role="banner">
      <div className="install-prompt-content">
        <span className="install-prompt-text">Install this app for a better experience</span>
        <div className="install-prompt-actions">
          <button className="install-prompt-btn" onClick={handleInstall}>Install</button>
          <button className="install-prompt-dismiss" onClick={handleDismiss} aria-label="Dismiss install prompt">&times;</button>
        </div>
      </div>
    </div>
  )
}
