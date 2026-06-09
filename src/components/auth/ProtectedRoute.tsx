import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppLoader } from '../ui/Loading'
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
    return <AppLoader message="Starting up" />
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
  const { user, loading, hasUsers, roleConfigs } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AppLoader message="Starting up" />
  }

  if (hasUsers === false && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />
  }

  if (hasUsers && location.pathname === '/setup') {
    return <Navigate to="/login" replace />
  }

  if (user) {
    return <Navigate to={getFirstAllowedRoute(user, roleConfigs)} replace />
  }

  return <Outlet />
}

export function DefaultRedirect() {
  const { user, roleConfigs } = useAuth()
  return (
    <Navigate to={user ? getFirstAllowedRoute(user, roleConfigs) : '/login'} replace />
  )
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
