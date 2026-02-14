const SESSION_KEY = 'portal-session'

export type UserRole = 'admin' | 'editor' | 'viewer'

interface UserAccount {
  email: string
  password: string
  role: UserRole
}

const ACCOUNTS: UserAccount[] = [
  { email: 'littledawgar@hotmail.com', password: 'Austinh99', role: 'admin' },
  { email: 'editor@austinshowell.dev', password: 'Editor123', role: 'editor' },
  { email: 'viewer@austinshowell.dev', password: 'Viewer123', role: 'viewer' },
]

export function login(email: string, password: string): boolean {
  const account = ACCOUNTS.find(
    a => a.email === email.toLowerCase().trim() && a.password === password
  )
  if (account) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      email: account.email,
      role: account.role,
      ts: Date.now(),
    }))
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

export function getSessionRole(): UserRole {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return 'viewer'
  try {
    return JSON.parse(raw).role || 'viewer'
  } catch {
    return 'viewer'
  }
}

export function hasPermission(required: UserRole): boolean {
  if (!isAuthenticated()) return false
  const role = getSessionRole()
  const hierarchy: UserRole[] = ['viewer', 'editor', 'admin']
  return hierarchy.indexOf(role) >= hierarchy.indexOf(required)
}
