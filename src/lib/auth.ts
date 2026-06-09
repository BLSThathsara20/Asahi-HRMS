import type { SystemUser, UserRole } from './types'

const SESSION_KEY = 'asahi-session'

export const SYSTEM_ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'super_admin', label: 'Super Admin', color: '#7c3aed' },
  { value: 'admin', label: 'Admin', color: '#1a6fd4' },
  { value: 'manager', label: 'Manager', color: '#059669' },
]

export function getRoleLabel(role: UserRole): string {
  return SYSTEM_ROLES.find((r) => r.value === role)?.label ?? role
}

export function getRoleColor(role: UserRole): string {
  return SYSTEM_ROLES.find((r) => r.value === role)?.color ?? '#64748b'
}

export function getAssignableRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === 'super_admin') {
    return ['super_admin', 'admin', 'manager']
  }
  if (actorRole === 'admin') {
    return ['admin', 'manager']
  }
  if (actorRole === 'manager') {
    return ['manager']
  }
  return []
}

export function saveSession(user: SystemUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function loadSession(): SystemUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SystemUser
  } catch {
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
