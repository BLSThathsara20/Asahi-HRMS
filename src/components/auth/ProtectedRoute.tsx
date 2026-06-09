import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getFirstAllowedRoute, ROUTE_PERMISSIONS } from '../../lib/permissions'
import { isSanityConfigured } from '../../lib/sanity/client'
import type { Permission } from '../../lib/types'

export function ProtectedRoute() {
  const { user, loading, hasUsers } = useAuth()
  const location = useLocation()

  if (!isSanityConfigured) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <div className="gradient-bg flex min-h-screen items-center justify-center">
        <div className="glass-strong rounded-2xl px-8 py-6 text-sm text-[var(--text-primary)]">
          Loading...
        </div>
      </div>
    )
  }

  if (hasUsers === false) {
    return <Navigate to="/setup" replace />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, loading, hasUsers } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="gradient-bg flex min-h-screen items-center justify-center">
        <div className="glass-strong rounded-2xl px-8 py-6 text-sm text-[var(--text-primary)]">
          Loading...
        </div>
      </div>
    )
  }

  if (hasUsers === false && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />
  }

  if (hasUsers && location.pathname === '/setup') {
    return <Navigate to="/login" replace />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export function PermissionRoute({ permission }: { permission: Permission }) {
  const { user, can, roleConfigs } = useAuth()

  if (!user || !can(permission)) {
    const fallback = user ? getFirstAllowedRoute(user, roleConfigs) : '/login'
    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}) {
  const { can } = useAuth()
  if (!can(permission)) return <>{fallback}</>
  return <>{children}</>
}

export function getRoutePermission(pathname: string): Permission | undefined {
  if (pathname === '/') return ROUTE_PERMISSIONS['/']
  const match = Object.entries(ROUTE_PERMISSIONS).find(
    ([route]) => route !== '/' && pathname.startsWith(route),
  )
  return match?.[1]
}
