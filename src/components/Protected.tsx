import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <FullscreenSpinner />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { isAdmin, loading } = useAuth()
  if (loading) return <FullscreenSpinner />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

export function FullscreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center text-neutral-500 text-sm">
      Loading…
    </div>
  )
}
