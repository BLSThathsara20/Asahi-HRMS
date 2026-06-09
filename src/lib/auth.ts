import type { AuthUser, RoleConfig } from './types'

const SESSION_KEY = 'asahi-session'

export function getRoleLabel(role: RoleConfig | string | null | undefined): string {
  if (!role) return 'No role'
  if (typeof role === 'string') return role.replace(/_/g, ' ')
  return role.name
}

export function getRoleColor(role: RoleConfig | string | null | undefined): string {
  if (!role || typeof role === 'string') return '#64748b'
  return role.color
}

export function getAssignableRoles(actor: AuthUser, allRoles: RoleConfig[]): RoleConfig[] {
  const actorSlug =
    actor.roleSlug ??
    (typeof actor.role === 'string' ? actor.role : actor.role?.slug) ??
    ''
  const actorRank = actor.role?.rank ?? 0
  if (actorSlug === 'super_admin') return allRoles
  return allRoles.filter((r) => r.rank < actorRank && r.slug !== 'super_admin')
}

export function saveSession(user: AuthUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

function normalizeRoleSlug(
  role: AuthUser['role'],
  roleSlug?: string,
): string {
  if (roleSlug) return roleSlug
  if (typeof role === 'string') return role
  if (role && typeof role === 'object' && 'slug' in role) return role.slug
  return 'manager'
}

export function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser & { role?: AuthUser['role'] | string }
    parsed.roleSlug = normalizeRoleSlug(parsed.role, parsed.roleSlug)
    return parsed
  } catch {
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
