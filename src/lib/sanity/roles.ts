import { getSanityClient, isSanityConfigured } from './client'
import { DEFAULT_ROLE_PERMISSIONS } from '../permissions'
import type { Permission, RoleConfig, UserRole } from '../types'

let mockRoleConfigs: RoleConfig[] = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(
  ([role, permissions]) => ({
    _id: `role-${role}`,
    role: role as UserRole,
    permissions,
    updatedAt: new Date().toISOString(),
  }),
)

export async function fetchRoleConfigs(): Promise<RoleConfig[]> {
  if (!isSanityConfigured) return mockRoleConfigs

  const configs = await getSanityClient().fetch<RoleConfig[]>(
    `*[_type == "roleConfig"] | order(role asc) { _id, role, permissions, updatedAt }`,
  )

  if (configs.length === 0) {
    return seedDefaultRoleConfigs()
  }

  return fillMissingRoles(configs)
}

function fillMissingRoles(configs: RoleConfig[]): RoleConfig[] {
  const roles: UserRole[] = ['super_admin', 'admin', 'manager']
  const result = [...configs]

  for (const role of roles) {
    if (!result.find((c) => c.role === role)) {
      result.push({
        _id: `default-${role}`,
        role,
        permissions: DEFAULT_ROLE_PERMISSIONS[role],
        updatedAt: new Date().toISOString(),
      })
    }
  }

  return result.sort((a, b) => a.role.localeCompare(b.role))
}

async function seedDefaultRoleConfigs(): Promise<RoleConfig[]> {
  const roles: UserRole[] = ['super_admin', 'admin', 'manager']
  const created: RoleConfig[] = []

  for (const role of roles) {
    const doc = await getSanityClient().create({
      _type: 'roleConfig',
      role,
      permissions: DEFAULT_ROLE_PERMISSIONS[role],
      updatedAt: new Date().toISOString(),
    })
    created.push({
      _id: doc._id,
      role,
      permissions: DEFAULT_ROLE_PERMISSIONS[role],
      updatedAt: new Date().toISOString(),
    })
  }

  return created
}

export async function updateRoleConfig(
  role: UserRole,
  permissions: Permission[],
): Promise<RoleConfig> {
  if (!isSanityConfigured) {
    const idx = mockRoleConfigs.findIndex((c) => c.role === role)
    const updated: RoleConfig = {
      _id: mockRoleConfigs[idx]?._id ?? `role-${role}`,
      role,
      permissions,
      updatedAt: new Date().toISOString(),
    }
    if (idx >= 0) mockRoleConfigs[idx] = updated
    else mockRoleConfigs.push(updated)
    return updated
  }

  const existing = await getSanityClient().fetch<{ _id: string } | null>(
    `*[_type == "roleConfig" && role == $role][0]{ _id }`,
    { role },
  )

  const now = new Date().toISOString()

  if (existing) {
    await getSanityClient()
      .patch(existing._id)
      .set({ permissions, updatedAt: now })
      .commit()

    return getSanityClient().fetch<RoleConfig>(
      `*[_type == "roleConfig" && _id == $id][0]{ _id, role, permissions, updatedAt }`,
      { id: existing._id },
    )
  }

  const doc = await getSanityClient().create({
    _type: 'roleConfig',
    role,
    permissions,
    updatedAt: now,
  })

  return {
    _id: doc._id,
    role,
    permissions,
    updatedAt: now,
  }
}

export function roleConfigsToMap(configs: RoleConfig[]): Record<UserRole, Permission[]> {
  return {
    super_admin:
      configs.find((c) => c.role === 'super_admin')?.permissions ??
      DEFAULT_ROLE_PERMISSIONS.super_admin,
    admin:
      configs.find((c) => c.role === 'admin')?.permissions ??
      DEFAULT_ROLE_PERMISSIONS.admin,
    manager:
      configs.find((c) => c.role === 'manager')?.permissions ??
      DEFAULT_ROLE_PERMISSIONS.manager,
  }
}
