import { useAuth } from '../context/AuthContext'
import { hasPermission, resolvePermissions } from '../lib/permissions'
import type { Permission } from '../lib/types'

export function usePermissions() {
  const { user, roleConfigs } = useAuth()

  return {
    user,
    roleConfigs,
    permissions: user ? resolvePermissions(user, roleConfigs) : [],
    can: (permission: Permission) => hasPermission(user, permission, roleConfigs),
  }
}
