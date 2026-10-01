import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageSkeleton } from './Skeleton'

/**
 * Route guard that redirects unauthenticated users to login
 * SECURITY: Prevents unauthorized access to protected pages at route level
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Page skeleton while the auth session is restored
  if (loading) {
    return <PageSkeleton />
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // For admin routes, the Admin page handles its own admin check
  // (RLS policies are the real security - this is just UX)
  return children
}
