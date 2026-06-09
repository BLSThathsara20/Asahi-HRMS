import type { AuthUser, Employee, Permission, RoleConfig } from './types'

export const ALL_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'dashboard.stats',
  'dashboard.attendance',
  'dashboard.departments',
  'departments.manage',
  'attendance.view',
  'attendance.manage',
  'attendance.export',
  'employees.view',
  'employees.register',
  'employees.manage_pay',
  'users.view',
  'users.register',
  'users.edit',
  'users.delete',
  'users.manage_permissions',
  'users.reset_activation',
  'employees.edit',
  'employees.delete',
  'roles.view',
  'roles.manage',
  'finance.view',
  'finance.manage',
  'finance.mark_paid',
]

export const PERMISSION_GROUPS: {
  label: string
  permissions: { key: Permission; label: string; description: string }[]
}[] = [
  {
    label: 'Dashboard',
    permissions: [
      { key: 'dashboard.view', label: 'View Dashboard', description: 'Access the main dashboard page' },
      { key: 'dashboard.stats', label: 'Stats Cards', description: 'View staff and attendance statistics' },
      { key: 'dashboard.attendance', label: 'Today\'s Attendance', description: 'View today\'s attendance list' },
      { key: 'dashboard.departments', label: 'Department Chart', description: 'View department breakdown chart' },
      { key: 'departments.manage', label: 'Manage Departments', description: 'Create, delete departments and assign employees' },
    ],
  },
  {
    label: 'Attendance',
    permissions: [
      { key: 'attendance.view', label: 'View Attendance', description: 'Access sign in/out page' },
      { key: 'attendance.manage', label: 'Manage Attendance', description: 'Sign employees in and out' },
      { key: 'attendance.export', label: 'Export Attendance PDF', description: 'Download employee attendance history as PDF' },
    ],
  },
  {
    label: 'People',
    permissions: [
      { key: 'employees.view', label: 'View People', description: 'Browse people list' },
      { key: 'employees.register', label: 'Register People', description: 'Add new people with login access' },
      { key: 'employees.edit', label: 'Edit People', description: 'Update person details' },
      { key: 'employees.delete', label: 'Remove People', description: 'Remove people from active list' },
      { key: 'employees.manage_pay', label: 'Manage Pay', description: 'Update pay rates and view pay change history' },
    ],
  },
  {
    label: 'Access Control',
    permissions: [
      { key: 'users.view', label: 'View Access', description: 'View user roles and permissions' },
      { key: 'users.register', label: 'Register People', description: 'Create people accounts' },
      { key: 'users.edit', label: 'Edit Users', description: 'Update user details and role' },
      { key: 'users.delete', label: 'Delete Users', description: 'Deactivate accounts' },
      { key: 'users.manage_permissions', label: 'Manage User Access', description: 'Set per-user custom permissions' },
      { key: 'users.reset_activation', label: 'Reset Password', description: 'Force phone verification and new password setup' },
    ],
  },
  {
    label: 'Roles & Permissions',
    permissions: [
      { key: 'roles.view', label: 'View Roles Module', description: 'Access roles and permissions page' },
      { key: 'roles.manage', label: 'Manage Roles', description: 'Create roles and edit default permissions' },
    ],
  },
  {
    label: 'Finance & Payroll',
    permissions: [
      { key: 'finance.view', label: 'View Finance', description: 'Access payroll and salary calculator' },
      { key: 'finance.manage', label: 'Run Payroll', description: 'Calculate and refresh salary figures' },
      { key: 'finance.mark_paid', label: 'Mark Salaries Paid', description: 'Mark employee salaries as paid or pending' },
    ],
  },
]

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [...ALL_PERMISSIONS],
  admin: [
    'dashboard.view',
    'dashboard.stats',
    'dashboard.attendance',
    'dashboard.departments',
    'departments.manage',
    'attendance.view',
    'attendance.manage',
    'attendance.export',
    'employees.view',
    'employees.register',
    'employees.edit',
    'employees.delete',
    'employees.manage_pay',
    'users.view',
    'users.register',
    'users.edit',
    'users.delete',
    'users.manage_permissions',
    'users.reset_activation',
    'roles.view',
    'roles.manage',
    'finance.view',
    'finance.manage',
    'finance.mark_paid',
  ],
  manager: [
    'dashboard.view',
    'dashboard.stats',
    'dashboard.attendance',
    'dashboard.departments',
    'attendance.view',
    'attendance.manage',
    'attendance.export',
    'employees.view',
    'employees.register',
    'employees.edit',
    'employees.delete',
    'employees.manage_pay',
    'users.view',
    'users.edit',
    'users.delete',
    'users.reset_activation',
  ],
}

/** Permissions auto-enabled when creating a new custom role */
export const DEFAULT_NEW_ROLE_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'dashboard.attendance',
  'attendance.view',
  'attendance.manage',
]

export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/': 'dashboard.view',
  '/attendance': 'attendance.view',
  '/employees': 'employees.view',
  '/register': 'employees.register',
  '/roles': 'roles.view',
  '/finance': 'finance.view',
}

export const NAV_ITEMS_CONFIG = [
  { to: '/', label: 'Dashboard', permission: 'dashboard.view' as Permission },
  { to: '/attendance', label: 'Attendance', permission: 'attendance.view' as Permission },
  { to: '/employees', label: 'People', permission: 'employees.view' as Permission },
  { to: '/register', label: 'Add Person', permission: 'employees.register' as Permission },
  { to: '/finance', label: 'Finance', permission: 'finance.view' as Permission },
  { to: '/roles', label: 'Roles', permission: 'roles.view' as Permission },
]

export type RolePermissionMap = Record<string, Permission[]>

export function getUserRoleSlug(user: AuthUser): string {
  if (user.roleSlug) return user.roleSlug
  const role = user.role as AuthUser['role'] | string | undefined
  if (typeof role === 'string') return role
  return role?.slug ?? 'manager'
}

export function getUserRoleRank(user: AuthUser): number {
  return user.role?.rank ?? 0
}

export function isSuperAdmin(user: AuthUser): boolean {
  return getUserRoleSlug(user) === 'super_admin'
}

export function isSuperAdminEmployee(employee: { role?: { slug?: string } | null }): boolean {
  return employee.role?.slug === 'super_admin'
}

export function canViewAttendanceHistory(user: AuthUser | null): boolean {
  if (!user) return false
  const slug = getUserRoleSlug(user)
  return slug === 'super_admin' || slug === 'admin' || slug === 'manager'
}

export function resolvePermissions(
  user: AuthUser,
  roleConfigs: RolePermissionMap = DEFAULT_ROLE_PERMISSIONS,
): Permission[] {
  if (isSuperAdmin(user)) return ALL_PERMISSIONS

  if (user.permissions && user.permissions.length > 0) {
    return user.permissions
  }

  const slug = getUserRoleSlug(user)

  if (roleConfigs[slug]) {
    return [...roleConfigs[slug]]
  }

  const role = user.role
  if (role && typeof role === 'object' && role.permissions?.length) {
    return [...role.permissions]
  }

  return DEFAULT_ROLE_PERMISSIONS[slug] ?? []
}

export function hasPermission(
  user: AuthUser | null,
  permission: Permission,
  roleConfigs: RolePermissionMap = DEFAULT_ROLE_PERMISSIONS,
): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  return resolvePermissions(user, roleConfigs).includes(permission)
}

export function hasAnyPermission(
  user: AuthUser | null,
  permissions: Permission[],
  roleConfigs?: RolePermissionMap,
): boolean {
  return permissions.some((p) => hasPermission(user, p, roleConfigs))
}

export function canEditRolePermissions(
  actor: AuthUser,
  targetRole: RoleConfig,
  roleConfigs?: RolePermissionMap,
): boolean {
  if (!hasPermission(actor, 'roles.manage', roleConfigs)) return false
  if (isSuperAdmin(actor)) return true
  if (getUserRoleSlug(actor) === 'admin' && targetRole.slug !== 'super_admin') return true
  return getUserRoleRank(actor) > targetRole.rank
}

export function canEditUserPermissions(
  actor: AuthUser,
  target: AuthUser,
  roleConfigs?: RolePermissionMap,
): boolean {
  if (!hasPermission(actor, 'users.manage_permissions', roleConfigs)) return false
  return canManageUser(actor, target, roleConfigs)
}

export function employeeToAuthTarget(employee: Employee): AuthUser {
  return {
    _id: employee._id,
    email: employee.email,
    firstName: employee.firstName,
    lastName: employee.lastName,
    role: employee.role ?? null,
    roleSlug: employee.role?.slug ?? 'manager',
    isActive: employee.isActive,
  }
}

export function canManageUser(
  actor: AuthUser,
  target: AuthUser,
  _roleConfigs?: RolePermissionMap,
): boolean {
  if (actor._id === target._id) return false
  if (isSuperAdmin(actor)) return true
  if (getUserRoleSlug(actor) === 'admin' && !isSuperAdmin(target)) return true
  return getUserRoleRank(actor) > getUserRoleRank(target)
}

export function isEmployeeSuperAdmin(employee: Employee): boolean {
  return isSuperAdmin(employeeToAuthTarget(employee))
}

export function canDeletePerson(
  actor: AuthUser | null,
  target: Employee,
  roleConfigs?: RolePermissionMap,
): boolean {
  if (!actor) return false
  if (actor._id === target._id) return false
  if (isEmployeeSuperAdmin(target)) return false
  if (!hasPermission(actor, 'employees.delete', roleConfigs)) return false
  if (isSuperAdmin(actor)) return true
  return canManageUser(actor, employeeToAuthTarget(target), roleConfigs)
}

export function getAssignableRoles(
  actor: AuthUser,
  allRoles: RoleConfig[],
): RoleConfig[] {
  if (isSuperAdmin(actor)) return allRoles
  const actorRank = getUserRoleRank(actor)
  return allRoles.filter((r) => r.rank < actorRank && r.slug !== 'super_admin')
}

export function getEditableRoles(actor: AuthUser, allRoles: RoleConfig[]): RoleConfig[] {
  return allRoles.filter((r) => canEditRolePermissions(actor, r))
}

export const PROTECTED_ROLE_SLUGS = ['super_admin', 'admin'] as const

export function canDeleteRole(role: RoleConfig): boolean {
  if (PROTECTED_ROLE_SLUGS.includes(role.slug as (typeof PROTECTED_ROLE_SLUGS)[number])) {
    return false
  }
  if (role._id.startsWith('default-')) return false
  return true
}

export function getFirstAllowedRoute(
  user: AuthUser,
  roleConfigs: RolePermissionMap = DEFAULT_ROLE_PERMISSIONS,
): string {
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (hasPermission(user, permission, roleConfigs)) return route
  }
  return '/login'
}
