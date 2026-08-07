import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import { Role } from '../api/types.ts'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user.role !== Role.Admin) {
    return <Navigate to="/profil" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
