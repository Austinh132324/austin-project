import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { isAuthenticated, getSessionEmail, getSessionRole, logout as doLogout, login as doLogin, type UserRole } from './auth'

interface AuthState {
  authenticated: boolean
  email: string | null
  role: UserRole
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  authenticated: false,
  email: null,
  role: 'viewer',
  login: () => false,
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated())
  const [email, setEmail] = useState<string | null>(() => isAuthenticated() ? getSessionEmail() : null)
  const [role, setRole] = useState<UserRole>(() => isAuthenticated() ? getSessionRole() : 'viewer')

  // Re-check auth on mount (handles page refresh)
  useEffect(() => {
    const authed = isAuthenticated()
    setAuthenticated(authed)
    if (authed) {
      setEmail(getSessionEmail())
      setRole(getSessionRole())
    } else {
      setEmail(null)
      setRole('viewer')
    }
  }, [])

  const login = useCallback((em: string, pw: string) => {
    const success = doLogin(em, pw)
    if (success) {
      setAuthenticated(true)
      setEmail(getSessionEmail())
      setRole(getSessionRole())
    }
    return success
  }, [])

  const logout = useCallback(() => {
    doLogout()
    setAuthenticated(false)
    setEmail(null)
    setRole('viewer')
  }, [])

  return (
    <AuthContext.Provider value={{ authenticated, email, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
