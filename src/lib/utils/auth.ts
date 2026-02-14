const SESSION_KEY = 'portal-session'

const CREDENTIALS = {
  email: 'littledawgar@hotmail.com',
  password: 'Austinh99',
}

export function login(email: string, password: string): boolean {
  if (email.toLowerCase().trim() === CREDENTIALS.email && password === CREDENTIALS.password) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: CREDENTIALS.email, ts: Date.now() }))
    return true
  }
  return false
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated(): boolean {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return false
  try {
    const session = JSON.parse(raw)
    // Sessions expire after 24 hours
    if (Date.now() - session.ts > 24 * 60 * 60 * 1000) {
      logout()
      return false
    }
    return true
  } catch {
    return false
  }
}

export function getSessionEmail(): string | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw).email
  } catch {
    return null
  }
}
