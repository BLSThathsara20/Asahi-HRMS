import { getSanityClient, isSanityConfigured } from './client'
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../permissions'
import type { Permission, RoleConfig } from '../types'

export const SYSTEM_ROLE_SEEDS: Omit<RoleConfig, '_id' | 'updatedAt'>[] = [
  {
    slug: 'super_admin',
    name: 'Super Admin',
    color: '#7c3aed',
    rank: 100,
    isSystem: true,
    permissions: [...ALL_PERMISSIONS],
  },
  {
    slug: 'admin',
    name: 'Admin',
    color: '#1a6fd4',
    rank: 50,
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.admin as Permission[],
  },
  {
    slug: 'manager',
    name: 'Manager',
    color: '#059669',
    rank: 10,
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.manager as Permission[],
  },
]

const ROLE_FIELDS = `_id, slug, name, color, permissions, isSystem, rank, updatedAt, role`

let mockRoleConfigs: RoleConfig[] = SYSTEM_ROLE_SEEDS.map((seed) => ({
  ...seed,
  _id: `role-${seed.slug}`,
  updatedAt: new Date().toISOString(),
}))

export function normalizeRoleConfig(raw: Record<string, unknown>): RoleConfig {
  const slug = String(raw.slug ?? raw.role ?? 'unknown')
  const seed = SYSTEM_ROLE_SEEDS.find((s) => s.slug === slug)
  return {
    _id: String(raw._id),
    slug,
    name: String(raw.name ?? seed?.name ?? slug.replace(/_/g, ' ')),
    color: String(raw.color ?? seed?.color ?? '#64748b'),
    permissions: (raw.permissions as Permission[]) ?? seed?.permissions ?? [],
    isSystem: Boolean(raw.isSystem ?? seed?.isSystem ?? false),
    rank: Number(raw.rank ?? seed?.rank ?? 0),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    role: raw.role ? String(raw.role) : undefined,
  }
}

export async function fetchRoleConfigs(): Promise<RoleConfig[]> {
  if (!isSanityConfigured) return mockRoleConfigs

  const configs = await getSanityClient().fetch<Record<string, unknown>[]>(
    `*[_type == "roleConfig"] | order(rank desc, name asc) { ${ROLE_FIELDS} }`,
  )

  if (configs.length === 0) {
    return seedDefaultRoleConfigs()
  }

  const normalized = configs.map(normalizeRoleConfig)
  return fillMissingSystemRoles(normalized)
}

function fillMissingSystemRoles(configs: RoleConfig[]): RoleConfig[] {
  const result = [...configs]
  for (const seed of SYSTEM_ROLE_SEEDS) {
    if (!result.find((c) => c.slug === seed.slug)) {
      result.push({
        ...seed,
        _id: `default-${seed.slug}`,
        updatedAt: new Date().toISOString(),
      })
    }
  }
  return result.sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name))
}

async function seedDefaultRoleConfigs(): Promise<RoleConfig[]> {
  const now = new Date().toISOString()
  const created: RoleConfig[] = []

  for (const seed of SYSTEM_ROLE_SEEDS) {
    const doc = await getSanityClient().create({
      _type: 'roleConfig',
      slug: seed.slug,
      name: seed.name,
      color: seed.color,
      rank: seed.rank,
      isSystem: seed.isSystem,
      permissions: seed.permissions,
      role: seed.slug,
      updatedAt: now,
    })
    created.push({ ...seed, _id: doc._id, updatedAt: now })
  }

  return created
}

export async function fetchRoleBySlug(slug: string): Promise<RoleConfig | null> {
  const configs = await fetchRoleConfigs()
  return configs.find((c) => c.slug === slug) ?? null
}

export interface CreateRoleInput {
  name: string
  slug?: string
  color?: string
  rank?: number
  permissions?: Permission[]
}

export function slugifyRoleName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export async function createRole(input: CreateRoleInput): Promise<RoleConfig> {
  const slug = input.slug ?? slugifyRoleName(input.name)
  if (!slug) throw new Error('Role name must contain letters or numbers')

  if (!isSanityConfigured) {
    const created: RoleConfig = {
      _id: `role-${slug}`,
      slug,
      name: input.name.trim(),
      color: input.color ?? '#64748b',
      rank: input.rank ?? 5,
      isSystem: false,
      permissions: input.permissions ?? [],
      updatedAt: new Date().toISOString(),
    }
    mockRoleConfigs.push(created)
    return created
  }

  const existing = await getSanityClient().fetch(
    `*[_type == "roleConfig" && slug == $slug][0]`,
    { slug },
  )
  if (existing) throw new Error('A role with this name already exists')

  const now = new Date().toISOString()
  const doc = await getSanityClient().create({
    _type: 'roleConfig',
    slug,
    name: input.name.trim(),
    color: input.color ?? '#64748b',
    rank: input.rank ?? 5,
    isSystem: false,
    permissions: input.permissions ?? [],
    updatedAt: now,
  })

  return normalizeRoleConfig({ ...doc, slug, name: input.name.trim() })
}

export async function updateRoleConfig(
  roleId: string,
  permissions: Permission[],
): Promise<RoleConfig> {
  if (!isSanityConfigured) {
    const idx = mockRoleConfigs.findIndex((c) => c._id === roleId)
    const updated: RoleConfig = {
      ...(mockRoleConfigs[idx] ?? mockRoleConfigs[0]),
      permissions,
      updatedAt: new Date().toISOString(),
    }
    if (idx >= 0) mockRoleConfigs[idx] = updated
    return updated
  }

  const now = new Date().toISOString()
  await getSanityClient().patch(roleId).set({ permissions, updatedAt: now }).commit()

  const raw = await getSanityClient().fetch<Record<string, unknown>>(
    `*[_type == "roleConfig" && _id == $id][0]{ ${ROLE_FIELDS} }`,
    { id: roleId },
  )
  return normalizeRoleConfig(raw)
}

export async function deleteRole(roleId: string): Promise<void> {
  if (!isSanityConfigured) {
    mockRoleConfigs = mockRoleConfigs.filter((c) => c._id !== roleId)
    return
  }

  const role = await getSanityClient().fetch<{ isSystem?: boolean; slug?: string } | null>(
    `*[_type == "roleConfig" && _id == $id][0]{ isSystem, slug }`,
    { id: roleId },
  )
  if (!role) throw new Error('Role not found')
  if (role.isSystem || role.slug === 'super_admin') {
    throw new Error('System roles cannot be deleted')
  }

  const inUse = await getSanityClient().fetch<number>(
    `count(*[_type == "employee" && role._ref == $id && isActive == true])`,
    { id: roleId },
  )
  if (inUse > 0) {
    throw new Error('Cannot delete a role that is assigned to active people')
  }

  await getSanityClient().delete(roleId)
}

export function roleConfigsToMap(configs: RoleConfig[]): Record<string, Permission[]> {
  const map: Record<string, Permission[]> = {}
  for (const config of configs) {
    map[config.slug] = config.permissions
  }
  return map
}
