import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  clearSession,
  loadSession,
  saveSession,
  getAssignableRoles,
} from '../lib/auth'
import {
  canEditRolePermissions,
  canEditUserPermissions,
  canManageUser,
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission,
  resolvePermissions,
  type RolePermissionMap,
} from '../lib/permissions'
import {
  countSystemUsers,
  fetchSystemUsers,
  loginUser,
  completeAccountSetup,
  registerSuperAdmin,
  registerSystemUser,
  resetUserActivation,
  updateSystemUser,
  deleteSystemUser,
  updateUserPermissions,
  type RegisterSystemUserInput,
  type UpdateSystemUserInput,
} from '../lib/sanity/auth'
import {
  fetchRoleConfigs,
  roleConfigsToMap,
  updateRoleConfig,
} from '../lib/sanity/roles'
import { isSanityConfigured } from '../lib/sanity/client'
import type { Permission, SystemUser, UserRole } from '../lib/types'

interface AuthContextValue {
  user: SystemUser | null
  loading: boolean
  hasUsers: boolean | null
  isAuthenticated: boolean
  permissions: Permission[]
  roleConfigs: RolePermissionMap
  login: (email: string, password: string) => Promise<void>
  completeSetup: (email: string, phone: string, password: string) => Promise<void>
  resetUserActivation: (userId: string) => Promise<SystemUser>
  updateSystemUser: (userId: string, input: UpdateSystemUserInput) => Promise<SystemUser>
  deleteSystemUser: (userId: string) => Promise<void>
  logout: () => void
  setupSuperAdmin: (input: Omit<RegisterSystemUserInput, 'role'>) => Promise<void>
  createSystemUser: (input: RegisterSystemUserInput) => Promise<void>
  updatePermissions: (userId: string, permissions: Permission[]) => Promise<void>
  updateRolePermissions: (role: UserRole, permissions: Permission[]) => Promise<void>
  reloadRoleConfigs: () => Promise<void>
  can: (permission: Permission) => boolean
  canManageUsers: boolean
  canManagePermissions: boolean
  canManageRoles: boolean
  canEditPermissionsFor: (target: SystemUser) => boolean
  canManageUserTarget: (target: SystemUser) => boolean
  canEditRole: (role: UserRole) => boolean
  assignableRoles: ReturnType<typeof getAssignableRoles>
  refreshUser: (updated: SystemUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SystemUser | null>(() => loadSession())
  const [loading, setLoading] = useState(true)
  const [hasUsers, setHasUsers] = useState<boolean | null>(null)
  const [roleConfigs, setRoleConfigs] = useState<RolePermissionMap>(DEFAULT_ROLE_PERMISSIONS)

  const reloadRoleConfigs = useCallback(async () => {
    try {
      const configs = await fetchRoleConfigs()
      setRoleConfigs(roleConfigsToMap(configs))
    } catch {
      setRoleConfigs(DEFAULT_ROLE_PERMISSIONS)
    }
  }, [])

  const checkUsers = useCallback(async () => {
    if (!isSanityConfigured) {
      setHasUsers(false)
      return
    }
    try {
      const count = await countSystemUsers()
      setHasUsers(count > 0)
    } catch {
      setHasUsers(null)
    }
  }, [])

  useEffect(() => {
    Promise.all([checkUsers(), reloadRoleConfigs()]).finally(() => setLoading(false))
  }, [checkUsers, reloadRoleConfigs])

  const refreshUser = (updated: SystemUser) => {
    saveSession(updated)
    setUser(updated)
  }

  const login = async (email: string, password: string) => {
    await reloadRoleConfigs()
    const loggedIn = await loginUser(email, password)
    saveSession(loggedIn)
    setUser(loggedIn)
    setHasUsers(true)
  }

  const completeSetup = async (email: string, phone: string, password: string) => {
    await reloadRoleConfigs()
    const loggedIn = await completeAccountSetup(email, phone, password)
    saveSession(loggedIn)
    setUser(loggedIn)
    setHasUsers(true)
  }

  const resetActivation = async (userId: string) => {
    if (!user || !hasPermission(user, 'users.reset_activation', roleConfigs)) {
      throw new Error('You do not have permission to reset password')
    }

    const target = (await fetchSystemUsers()).find((u) => u._id === userId)
    if (!target || !canManageUser(user, target, roleConfigs)) {
      throw new Error('You cannot reset this user\'s password')
    }

    return resetUserActivation(userId)
  }

  const updateSystemUserAccount = async (userId: string, input: UpdateSystemUserInput) => {
    if (!user || !hasPermission(user, 'users.edit', roleConfigs)) {
      throw new Error('You do not have permission to edit users')
    }

    const target = (await fetchSystemUsers()).find((u) => u._id === userId)
    if (!target || !canManageUser(user, target, roleConfigs)) {
      throw new Error('You cannot edit this user')
    }

    const allowed = getAssignableRoles(user.role)
    if (!allowed.includes(input.role)) {
      throw new Error('You cannot assign this role')
    }

    const updated = await updateSystemUser(userId, input)
    if (user._id === userId) {
      refreshUser(updated)
    }
    return updated
  }

  const removeSystemUser = async (userId: string) => {
    if (!user || !hasPermission(user, 'users.delete', roleConfigs)) {
      throw new Error('You do not have permission to delete users')
    }

    const target = (await fetchSystemUsers()).find((u) => u._id === userId)
    if (!target || !canManageUser(user, target, roleConfigs)) {
      throw new Error('You cannot delete this user')
    }

    await deleteSystemUser(userId)
  }

  const logout = () => {
    clearSession()
    setUser(null)
  }

  const setupSuperAdmin = async (input: Omit<RegisterSystemUserInput, 'role'>) => {
    const created = await registerSuperAdmin(input)
    await reloadRoleConfigs()
    saveSession(created)
    setUser(created)
    setHasUsers(true)
  }

  const createSystemUser = async (input: RegisterSystemUserInput) => {
    if (!user || !hasPermission(user, 'users.register', roleConfigs)) {
      throw new Error('You do not have permission to register users')
    }

    const allowed = getAssignableRoles(user.role)
    if (!allowed.includes(input.role)) {
      throw new Error('You cannot assign this role')
    }

    await registerSystemUser(input)
  }

  const updatePermissions = async (userId: string, permissions: Permission[]) => {
    if (!user || !hasPermission(user, 'users.manage_permissions', roleConfigs)) {
      throw new Error('You do not have permission to manage access levels')
    }

    const updated = await updateUserPermissions(userId, permissions)
    if (user._id === userId) {
      refreshUser(updated)
    }
  }

  const updateRolePermissions = async (role: UserRole, permissions: Permission[]) => {
    if (!user || !canEditRolePermissions(user, role, roleConfigs)) {
      throw new Error('You do not have permission to manage this role')
    }

    await updateRoleConfig(role, permissions)
    await reloadRoleConfigs()

    if (user.role === role && (!user.permissions || user.permissions.length === 0)) {
      refreshUser(user)
    }
  }

  const permissions = user ? resolvePermissions(user, roleConfigs) : []

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasUsers,
        isAuthenticated: !!user,
        permissions,
        roleConfigs,
        login,
        completeSetup,
        resetUserActivation: resetActivation,
        updateSystemUser: updateSystemUserAccount,
        deleteSystemUser: removeSystemUser,
        logout,
        setupSuperAdmin,
        createSystemUser,
        updatePermissions,
        updateRolePermissions,
        reloadRoleConfigs,
        can: (permission) => hasPermission(user, permission, roleConfigs),
        canManageUsers: hasPermission(user, 'users.register', roleConfigs),
        canManagePermissions: hasPermission(user, 'users.manage_permissions', roleConfigs),
        canManageRoles: hasPermission(user, 'roles.manage', roleConfigs),
        canEditPermissionsFor: (target) =>
          user ? canEditUserPermissions(user, target, roleConfigs) : false,
        canManageUserTarget: (target) =>
          user ? canManageUser(user, target, roleConfigs) : false,
        canEditRole: (role) =>
          user ? canEditRolePermissions(user, role, roleConfigs) : false,
        assignableRoles: user ? getAssignableRoles(user.role) : [],
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
