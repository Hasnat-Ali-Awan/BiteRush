import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePathForRole } from '../api'

export default function RequireAuth({ role, roles, children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  const allowed = roles || (role ? [role] : null)

  if (!ready) {
    return (
      <p className="p-8 text-center text-on-surface-variant">Loading account…</p>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return children
}
