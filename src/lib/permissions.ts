import type { Permission, SystemUser, UserRole } from './types'

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
    label: 'Employees',
    permissions: [
      { key: 'employees.view', label: 'View Employees', description: 'Browse employee list' },
      { key: 'employees.register', label: 'Register Employees', description: 'Add new dealership employees' },
      { key: 'employees.edit', label: 'Edit Employees', description: 'Update employee details' },
      { key: 'employees.delete', label: 'Delete Employees', description: 'Remove employees from active list' },
      { key: 'employees.manage_pay', label: 'Manage Employee Pay', description: 'Update pay rates and view pay change history' },
    ],
  },
  {
    label: 'System Users',
    permissions: [
      { key: 'users.view', label: 'View Users', description: 'Access system users page' },
      { key: 'users.register', label: 'Register Users', description: 'Create manager, admin, super admin accounts' },
      { key: 'users.edit', label: 'Edit Users', description: 'Update user name, email, phone and role' },
      { key: 'users.delete', label: 'Delete Users', description: 'Deactivate system user accounts' },
      { key: 'users.manage_permissions', label: 'Manage User Access', description: 'Set per-user custom permissions' },
      { key: 'users.reset_activation', label: 'Reset Password', description: 'Force phone verification and new password setup' },
    ],
  },
  {
    label: 'Roles & Permissions',
    permissions: [
      { key: 'roles.view', label: 'View Roles Module', description: 'Access roles and permissions page' },
      { key: 'roles.manage', label: 'Manage Role Permissions', description: 'Edit default permissions per role' },
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

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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

export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/': 'dashboard.view',
  '/attendance': 'attendance.view',
  '/employees': 'employees.view',
  '/register': 'employees.register',
  '/users': 'users.view',
  '/roles': 'roles.view',
  '/finance': 'finance.view',
}

export const NAV_ITEMS_CONFIG = [
  { to: '/', label: 'Dashboard', permission: 'dashboard.view' as Permission },
  { to: '/attendance', label: 'Sign In / Out', permission: 'attendance.view' as Permission },
  { to: '/employees', label: 'Employees', permission: 'employees.view' as Permission },
  { to: '/register', label: 'Register', permission: 'employees.register' as Permission },
  { to: '/finance', label: 'Finance', permission: 'finance.view' as Permission },
  { to: '/roles', label: 'Roles', permission: 'roles.view' as Permission },
  { to: '/users', label: 'Users', permission: 'users.view' as Permission },
]

export type RolePermissionMap = Record<UserRole, Permission[]>

export function resolvePermissions(
  user: SystemUser,
  roleConfigs: RolePermissionMap = DEFAULT_ROLE_PERMISSIONS,
): Permission[] {
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions
  }
  return roleConfigs[user.role] ?? DEFAULT_ROLE_PERMISSIONS[user.role]
}

export function hasPermission(
  user: SystemUser | null,
  permission: Permission,
  roleConfigs: RolePermissionMap = DEFAULT_ROLE_PERMISSIONS,
): boolean {
  if (!user) return false
  return resolvePermissions(user, roleConfigs).includes(permission)
}

export function hasAnyPermission(
  user: SystemUser | null,
  permissions: Permission[],
  roleConfigs?: RolePermissionMap,
): boolean {
  return permissions.some((p) => hasPermission(user, p, roleConfigs))
}

export function canEditRolePermissions(
  actor: SystemUser,
  targetRole: UserRole,
  roleConfigs?: RolePermissionMap,
): boolean {
  if (!hasPermission(actor, 'roles.manage', roleConfigs)) return false
  if (actor.role === 'super_admin') return true
  if (actor.role === 'admin' && targetRole !== 'super_admin') return true
  return false
}

export function canEditUserPermissions(
  actor: SystemUser,
  target: SystemUser,
  roleConfigs?: RolePermissionMap,
): boolean {
  if (!hasPermission(actor, 'users.manage_permissions', roleConfigs)) return false
  return canManageUser(actor, target, roleConfigs)
}

export function canManageUser(
  actor: SystemUser,
  target: SystemUser,
  _roleConfigs?: RolePermissionMap,
): boolean {
  if (actor._id === target._id) return false
  if (actor.role === 'super_admin') return true
  if (actor.role === 'admin' && target.role !== 'super_admin') return true
  if (actor.role === 'manager' && target.role === 'manager') return true
  return false
}

export function getEditableRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === 'super_admin') return ['super_admin', 'admin', 'manager']
  if (actorRole === 'admin') return ['admin', 'manager']
  return []
}

export function getFirstAllowedRoute(
  user: SystemUser,
  roleConfigs: RolePermissionMap = DEFAULT_ROLE_PERMISSIONS,
): string {
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (hasPermission(user, permission, roleConfigs)) return route
  }
  return '/login'
}
