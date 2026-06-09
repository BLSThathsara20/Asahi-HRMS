import bcrypt from 'bcryptjs'
import { getSanityClient, isSanityConfigured } from './client'
import { normalizePhone, phonesMatch } from '../phone'
import { ALL_PERMISSIONS } from '../permissions'
import { fetchRoleBySlug, fetchRoleConfigs } from './roles'
import type { AuthUser, LoginCheckStatus, Permission, RoleConfig } from '../types'

const ROLE_FIELDS = `_id, slug, name, color, permissions, isSystem, rank, updatedAt, role`

const AUTH_USER_FIELDS = `
  _id,
  employeeId,
  email,
  firstName,
  lastName,
  phone,
  mustSetPassword,
  permissions,
  isActive,
  createdAt,
  "role": role->{ ${ROLE_FIELDS} }
`

interface EmployeeAuthRow extends Omit<AuthUser, 'roleSlug'> {
  role: RoleConfig | null
  passwordHash?: string
}

function toAuthUser(row: EmployeeAuthRow): AuthUser {
  const role = row.role
  return {
    _id: row._id,
    employeeId: row.employeeId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    mustSetPassword: row.mustSetPassword,
    role,
    roleSlug: role?.slug ?? 'manager',
    permissions: row.permissions,
    isActive: row.isActive,
    createdAt: row.createdAt,
  }
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function countLoginAccounts(): Promise<number> {
  if (!isSanityConfigured) return 0
  return getSanityClient().fetch<number>(
    `count(*[_type == "employee" && isActive == true && defined(role)])`,
  )
}

/** @deprecated */
export const countSystemUsers = countLoginAccounts

export async function fetchAuthUsers(): Promise<AuthUser[]> {
  if (!isSanityConfigured) return []
  const rows = await getSanityClient().fetch<EmployeeAuthRow[]>(
    `*[_type == "employee" && isActive == true && defined(role)] | order(createdAt desc) { ${AUTH_USER_FIELDS} }`,
  )
  return rows.map(toAuthUser)
}

/** @deprecated */
export const fetchSystemUsers = fetchAuthUsers

export async function checkLoginStatus(email: string): Promise<LoginCheckStatus> {
  if (!isSanityConfigured) return { status: 'not_configured' }

  const normalizedEmail = email.toLowerCase().trim()
  const user = await getSanityClient().fetch<{
    firstName: string
    mustSetPassword?: boolean
  } | null>(
    `*[_type == "employee" && email == $email && isActive == true && defined(role)][0] {
      firstName,
      mustSetPassword
    }`,
    { email: normalizedEmail },
  )

  if (!user) return { status: 'not_found' }
  if (user.mustSetPassword) {
    return { status: 'pending_setup', firstName: user.firstName }
  }
  return { status: 'active', firstName: user.firstName }
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  if (!isSanityConfigured) throw new Error('Sanity is not configured')

  const row = await getSanityClient().fetch<EmployeeAuthRow | null>(
    `*[_type == "employee" && email == $email && isActive == true && defined(role)][0] {
      ${AUTH_USER_FIELDS},
      passwordHash
    }`,
    { email: email.toLowerCase().trim() },
  )

  if (!row?.passwordHash) throw new Error('Invalid email or password')
  if (row.mustSetPassword) {
    throw new Error(
      'This account needs setup. Enter your email and follow the first-time login steps.',
    )
  }

  const valid = await bcrypt.compare(password, row.passwordHash)
  if (!valid) throw new Error('Invalid email or password')

  const { passwordHash: _, ...safe } = row
  return toAuthUser(safe)
}

export async function verifyPhoneForSetup(email: string, phone: string): Promise<void> {
  if (!isSanityConfigured) throw new Error('Sanity is not configured')

  const user = await getSanityClient().fetch<{ phone?: string; mustSetPassword?: boolean } | null>(
    `*[_type == "employee" && email == $email && isActive == true][0] { phone, mustSetPassword }`,
    { email: email.toLowerCase().trim() },
  )

  if (!user?.mustSetPassword) throw new Error('This account is already set up')
  if (!user.phone || !phonesMatch(user.phone, phone)) {
    throw new Error('Phone number does not match our records')
  }
}

export async function completeAccountSetup(
  email: string,
  phone: string,
  password: string,
): Promise<AuthUser> {
  if (!isSanityConfigured) throw new Error('Sanity is not configured')
  if (password.length < 8) throw new Error('Password must be at least 8 characters')

  const row = await getSanityClient().fetch<EmployeeAuthRow | null>(
    `*[_type == "employee" && email == $email && isActive == true][0] {
      ${AUTH_USER_FIELDS},
      passwordHash
    }`,
    { email: email.toLowerCase().trim() },
  )

  if (!row) throw new Error('Account not found')
  if (!row.mustSetPassword) {
    throw new Error('This account is already set up. Sign in with your password.')
  }
  if (!row.phone || !phonesMatch(row.phone, phone)) {
    throw new Error('Phone number does not match our records')
  }

  const passwordHash = await hashPassword(password)
  await getSanityClient()
    .patch(row._id)
    .set({ passwordHash, mustSetPassword: false })
    .commit()

  return toAuthUser({ ...row, mustSetPassword: false })
}

export async function resetUserActivation(userId: string): Promise<AuthUser> {
  if (!isSanityConfigured) throw new Error('Sanity is not configured')

  const passwordHash = await hashPassword(`RESET_${crypto.randomUUID()}_${Date.now()}`)
  await getSanityClient()
    .patch(userId)
    .set({ mustSetPassword: true, passwordHash })
    .commit()

  const row = await getSanityClient().fetch<EmployeeAuthRow>(
    `*[_type == "employee" && _id == $id][0] { ${AUTH_USER_FIELDS} }`,
    { id: userId },
  )
  return toAuthUser(row)
}

export interface RegisterAuthUserInput {
  email: string
  password?: string
  firstName: string
  lastName: string
  phone?: string
  roleId: string
  permissions?: Permission[]
}

async function getDefaultDepartmentId(): Promise<string> {
  const dept = await getSanityClient().fetch<{ _id: string } | null>(
    `*[_type == "department" && isActive == true] | order(name asc)[0]{ _id }`,
  )
  if (!dept) throw new Error('Create at least one department before registering users')
  return dept._id
}

export async function registerSuperAdmin(
  input: Omit<RegisterAuthUserInput, 'roleId'>,
): Promise<AuthUser> {
  if (!isSanityConfigured) throw new Error('Sanity is not configured')

  const existing = await countLoginAccounts()
  if (existing > 0) throw new Error('A super admin already exists. Please sign in.')
  if (!input.password || input.password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  await fetchRoleConfigs()
  const superRole = await fetchRoleBySlug('super_admin')
  if (!superRole) throw new Error('Super Admin role not found')

  const departmentId = await getDefaultDepartmentId()
  const employeeId = await getSanityClient().fetch<string>(
    `*[_type == "employee"].employeeId | order(employeeId desc)[0]`,
  )
  const nextId = employeeId
    ? `AG-${String(parseInt(employeeId.replace(/\D/g, ''), 10) + 1).padStart(3, '0')}`
    : 'AG-001'

  const passwordHash = await hashPassword(input.password)
  const now = new Date().toISOString()

  const doc = await getSanityClient().create({
    _type: 'employee',
    employeeId: nextId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.toLowerCase().trim(),
    phone: input.phone ? normalizePhone(input.phone) : undefined,
    department: { _type: 'reference', _ref: departmentId },
    jobTitle: 'Super Admin',
    startDate: now.split('T')[0],
    employmentType: 'full_time',
    paymentMethod: 'monthly',
    payRate: 0,
    mustSetPassword: false,
    role: { _type: 'reference', _ref: superRole._id },
    permissions: [...ALL_PERMISSIONS],
    passwordHash,
    isActive: true,
    createdAt: now,
  })

  return toAuthUser({
    _id: doc._id,
    employeeId: nextId,
    email: input.email.toLowerCase().trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone ? normalizePhone(input.phone) : undefined,
    mustSetPassword: false,
    role: superRole,
    permissions: [...ALL_PERMISSIONS],
    isActive: true,
    createdAt: now,
  })
}

export interface UpdateAuthUserInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  roleId: string
}

export async function updateAuthUser(
  userId: string,
  input: UpdateAuthUserInput,
): Promise<AuthUser> {
  if (!isSanityConfigured) throw new Error('Sanity is not configured')

  const email = input.email.toLowerCase().trim()
  const duplicate = await getSanityClient().fetch<{ _id: string } | null>(
    `*[_type == "employee" && email == $email && _id != $id][0]{ _id }`,
    { email, id: userId },
  )
  if (duplicate) throw new Error('Another user already uses this email')

  await getSanityClient()
    .patch(userId)
    .set({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      phone: normalizePhone(input.phone),
      role: { _type: 'reference', _ref: input.roleId },
    })
    .commit()

  const row = await getSanityClient().fetch<EmployeeAuthRow>(
    `*[_type == "employee" && _id == $id][0] { ${AUTH_USER_FIELDS} }`,
    { id: userId },
  )
  return toAuthUser(row)
}

/** @deprecated */
export const updateSystemUser = updateAuthUser

export async function deleteAuthUser(userId: string): Promise<void> {
  if (!isSanityConfigured) throw new Error('Sanity is not configured')
  await getSanityClient().patch(userId).set({ isActive: false }).commit()
}

/** @deprecated */
export const deleteSystemUser = deleteAuthUser

export async function updateUserPermissions(
  userId: string,
  permissions: Permission[],
): Promise<AuthUser> {
  if (!isSanityConfigured) throw new Error('Sanity is not configured')

  await getSanityClient().patch(userId).set({ permissions }).commit()

  const row = await getSanityClient().fetch<EmployeeAuthRow>(
    `*[_type == "employee" && _id == $id][0] { ${AUTH_USER_FIELDS} }`,
    { id: userId },
  )
  return toAuthUser(row)
}
