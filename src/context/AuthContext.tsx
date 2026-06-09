import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { clearSession, loadSession, saveSession } from '../lib/auth'
import {
  canEditRolePermissions,
  canEditUserPermissions,
  canManageUser,
  DEFAULT_ROLE_PERMISSIONS,
  getAssignableRoles,
  hasPermission,
  resolvePermissions,
  type RolePermissionMap,
} from '../lib/permissions'
import {
  countLoginAccounts,
  fetchAuthUsers,
  loginUser,
  completeAccountSetup,
  registerSuperAdmin,
  resetUserActivation,
  updateAuthUser,
  deleteAuthUser,
  updateUserPermissions,
  type RegisterAuthUserInput,
  type UpdateAuthUserInput,
} from '../lib/sanity/auth'
import {
  createRole,
  fetchRoleConfigs,
  roleConfigsToMap,
  updateRoleConfig,
  deleteRole,
  type CreateRoleInput,
} from '../lib/sanity/roles'
import { isSanityConfigured } from '../lib/sanity/client'
import type { AuthUser, Permission, RoleConfig } from '../lib/types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  hasUsers: boolean | null
  isAuthenticated: boolean
  permissions: Permission[]
  roleConfigs: RolePermissionMap
  roles: RoleConfig[]
  login: (email: string, password: string) => Promise<void>
  completeSetup: (email: string, phone: string, password: string) => Promise<void>
  resetUserActivation: (userId: string) => Promise<AuthUser>
  updateAuthUser: (userId: string, input: UpdateAuthUserInput) => Promise<AuthUser>
  deleteAuthUser: (userId: string) => Promise<void>
  logout: () => void
  setupSuperAdmin: (input: Omit<RegisterAuthUserInput, 'roleId'>) => Promise<void>
  updatePermissions: (userId: string, permissions: Permission[]) => Promise<void>
  updateRolePermissions: (roleId: string, permissions: Permission[]) => Promise<void>
  createRole: (input: CreateRoleInput) => Promise<RoleConfig>
  removeRole: (roleId: string) => Promise<void>
  reloadRoleConfigs: () => Promise<void>
  can: (permission: Permission) => boolean
  canManagePermissions: boolean
  canManageRoles: boolean
  canEditPermissionsFor: (target: AuthUser) => boolean
  canManageUserTarget: (target: AuthUser) => boolean
  canEditRole: (role: RoleConfig) => boolean
  assignableRoles: RoleConfig[]
  refreshUser: (updated: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadSession())
  const [loading, setLoading] = useState(true)
  const [hasUsers, setHasUsers] = useState<boolean | null>(null)
  const [roleConfigs, setRoleConfigs] = useState<RolePermissionMap>(DEFAULT_ROLE_PERMISSIONS)
  const [roles, setRoles] = useState<RoleConfig[]>([])

  const reloadRoleConfigs = useCallback(async () => {
    try {
      const configs = await fetchRoleConfigs()
      setRoles(configs)
      setRoleConfigs(roleConfigsToMap(configs))
    } catch {
      setRoleConfigs(DEFAULT_ROLE_PERMISSIONS)
      setRoles([])
    }
  }, [])

  const checkUsers = useCallback(async () => {
    if (!isSanityConfigured) {
      setHasUsers(false)
      return
    }
    try {
      const count = await countLoginAccounts()
      setHasUsers(count > 0)
    } catch {
      setHasUsers(null)
    }
  }, [])

  useEffect(() => {
    Promise.all([checkUsers(), reloadRoleConfigs()]).finally(() => setLoading(false))
  }, [checkUsers, reloadRoleConfigs])

  const refreshUser = (updated: AuthUser) => {
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
    const target = (await fetchAuthUsers()).find((u) => u._id === userId)
    if (!target || !canManageUser(user, target, roleConfigs)) {
      throw new Error("You cannot reset this user's password")
    }
    return resetUserActivation(userId)
  }

  const updateUserAccount = async (userId: string, input: UpdateAuthUserInput) => {
    if (!user || !hasPermission(user, 'users.edit', roleConfigs)) {
      throw new Error('You do not have permission to edit users')
    }
    const target = (await fetchAuthUsers()).find((u) => u._id === userId)
    if (!target || !canManageUser(user, target, roleConfigs)) {
      throw new Error('You cannot edit this user')
    }
    const allowed = getAssignableRoles(user, roles)
    if (!allowed.find((r) => r._id === input.roleId)) {
      throw new Error('You cannot assign this role')
    }
    const updated = await updateAuthUser(userId, input)
    if (user._id === userId) refreshUser(updated)
    return updated
  }

  const removeUser = async (userId: string) => {
    if (!user || !hasPermission(user, 'users.delete', roleConfigs)) {
      throw new Error('You do not have permission to delete users')
    }
    const target = (await fetchAuthUsers()).find((u) => u._id === userId)
    if (!target || !canManageUser(user, target, roleConfigs)) {
      throw new Error('You cannot delete this user')
    }
    await deleteAuthUser(userId)
  }

  const logout = () => {
    clearSession()
    setUser(null)
  }

  const setupSuperAdmin = async (input: Omit<RegisterAuthUserInput, 'roleId'>) => {
    const created = await registerSuperAdmin(input)
    await reloadRoleConfigs()
    saveSession(created)
    setUser(created)
    setHasUsers(true)
  }

  const updatePermissions = async (userId: string, perms: Permission[]) => {
    if (!user || !hasPermission(user, 'users.manage_permissions', roleConfigs)) {
      throw new Error('You do not have permission to manage access levels')
    }
    const updated = await updateUserPermissions(userId, perms)
    if (user._id === userId) refreshUser(updated)
  }

  const updateRolePerms = async (roleId: string, perms: Permission[]) => {
    const role = roles.find((r) => r._id === roleId)
    if (!user || !role || !canEditRolePermissions(user, role, roleConfigs)) {
      throw new Error('You do not have permission to manage this role')
    }
    await updateRoleConfig(roleId, perms)
    await reloadRoleConfigs()
    if (user.role?._id === roleId && (!user.permissions || user.permissions.length === 0)) {
      refreshUser(user)
    }
  }

  const addRole = async (input: CreateRoleInput) => {
    if (!user || !hasPermission(user, 'roles.manage', roleConfigs)) {
      throw new Error('You do not have permission to create roles')
    }
    const created = await createRole(input)
    await reloadRoleConfigs()
    return created
  }

  const removeRoleById = async (roleId: string) => {
    if (!user || !hasPermission(user, 'roles.manage', roleConfigs)) {
      throw new Error('You do not have permission to delete roles')
    }
    await deleteRole(roleId)
    await reloadRoleConfigs()
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
        roles,
        login,
        completeSetup,
        resetUserActivation: resetActivation,
        updateAuthUser: updateUserAccount,
        deleteAuthUser: removeUser,
        logout,
        setupSuperAdmin,
        updatePermissions,
        updateRolePermissions: updateRolePerms,
        createRole: addRole,
        removeRole: removeRoleById,
        reloadRoleConfigs,
        can: (permission) => hasPermission(user, permission, roleConfigs),
        canManagePermissions: hasPermission(user, 'users.manage_permissions', roleConfigs),
        canManageRoles: hasPermission(user, 'roles.manage', roleConfigs),
        canEditPermissionsFor: (target) =>
          user ? canEditUserPermissions(user, target, roleConfigs) : false,
        canManageUserTarget: (target) =>
          user ? canManageUser(user, target, roleConfigs) : false,
        canEditRole: (role) =>
          user ? canEditRolePermissions(user, role, roleConfigs) : false,
        assignableRoles: user ? getAssignableRoles(user, roles) : [],
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
