import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/utils/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuth()

  if (!authenticated) {
    return <Navigate to="/portal/login" replace />
  }

  return <>{children}</>
}
