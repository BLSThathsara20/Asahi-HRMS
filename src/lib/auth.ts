import type { AuthUser, RoleConfig } from './types'

const SESSION_KEY = 'asahi-session'
/** Keep users signed in for one year after login (or last session refresh). */
const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000

interface StoredSession {
  user: AuthUser
  expiresAt: number
}

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

function normalizeRoleSlug(
  role: AuthUser['role'],
  roleSlug?: string,
): string {
  if (roleSlug) return roleSlug
  if (typeof role === 'string') return role
  if (role && typeof role === 'object' && 'slug' in role) return role.slug
  return 'manager'
}

function normalizeUser(user: AuthUser): AuthUser {
  return {
    ...user,
    roleSlug: normalizeRoleSlug(user.role, user.roleSlug),
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'email' in value &&
    typeof (value as AuthUser).email === 'string'
  )
}

function isStoredSession(value: unknown): value is StoredSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    'expiresAt' in value &&
    'user' in value &&
    isAuthUser((value as StoredSession).user)
  )
}

export function saveSession(user: AuthUser): void {
  const payload: StoredSession = {
    user: normalizeUser(user),
    expiresAt: Date.now() + SESSION_TTL_MS,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

export function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)

    if (isStoredSession(parsed)) {
      if (Date.now() > parsed.expiresAt) {
        clearSession()
        return null
      }
      return normalizeUser(parsed.user)
    }

    if (isAuthUser(parsed)) {
      const user = normalizeUser(parsed)
      saveSession(user)
      return user
    }

    clearSession()
    return null
  } catch {
    clearSession()
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
