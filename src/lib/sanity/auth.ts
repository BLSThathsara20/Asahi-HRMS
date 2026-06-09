import bcrypt from 'bcryptjs'
import { getSanityClient, isSanityConfigured } from './client'
import { normalizePhone, phonesMatch } from '../phone'
import { ALL_PERMISSIONS } from '../permissions'
import type { LoginCheckStatus, Permission, SystemUser, UserRole } from '../types'

const USER_FIELDS = `
  _id,
  email,
  firstName,
  lastName,
  phone,
  mustSetPassword,
  role,
  permissions,
  isActive,
  createdAt
`

interface SystemUserWithHash extends SystemUser {
  passwordHash: string
}

export async function countSystemUsers(): Promise<number> {
  if (!isSanityConfigured) return 0

  return getSanityClient().fetch<number>(
    `count(*[_type == "systemUser" && isActive == true])`,
  )
}

export async function fetchSystemUsers(): Promise<SystemUser[]> {
  if (!isSanityConfigured) return []

  return getSanityClient().fetch<SystemUser[]>(
    `*[_type == "systemUser" && isActive == true] | order(createdAt desc) { ${USER_FIELDS} }`,
  )
}

export async function checkLoginStatus(email: string): Promise<LoginCheckStatus> {
  if (!isSanityConfigured) {
    return { status: 'not_configured' }
  }

  const normalizedEmail = email.toLowerCase().trim()

  const user = await getSanityClient().fetch<{
    firstName: string
    mustSetPassword?: boolean
  } | null>(
    `*[_type == "systemUser" && email == $email && isActive == true][0] {
      firstName,
      mustSetPassword
    }`,
    { email: normalizedEmail },
  )

  if (!user) {
    const employee = await getSanityClient().fetch<{ firstName: string } | null>(
      `*[_type == "employee" && email == $email && isActive == true][0] { firstName }`,
      { email: normalizedEmail },
    )
    if (employee) {
      return { status: 'employee_only', firstName: employee.firstName }
    }
    return { status: 'not_found' }
  }

  if (user.mustSetPassword) {
    return { status: 'pending_setup', firstName: user.firstName }
  }

  return { status: 'active', firstName: user.firstName }
}

export async function loginUser(email: string, password: string): Promise<SystemUser> {
  if (!isSanityConfigured) {
    throw new Error('Sanity is not configured')
  }

  const user = await getSanityClient().fetch<SystemUserWithHash | null>(
    `*[_type == "systemUser" && email == $email && isActive == true][0] {
      ${USER_FIELDS},
      passwordHash
    }`,
    { email: email.toLowerCase().trim() },
  )

  if (!user) {
    throw new Error('Invalid email or password')
  }

  if (user.mustSetPassword) {
    throw new Error(
      'This account needs setup. Enter your email and follow the first-time login steps.',
    )
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw new Error('Invalid email or password')
  }

  const { passwordHash: _, ...safeUser } = user
  return safeUser
}

export async function verifyPhoneForSetup(email: string, phone: string): Promise<void> {
  if (!isSanityConfigured) {
    throw new Error('Sanity is not configured')
  }

  const user = await getSanityClient().fetch<{ phone?: string; mustSetPassword?: boolean } | null>(
    `*[_type == "systemUser" && email == $email && isActive == true][0] { phone, mustSetPassword }`,
    { email: email.toLowerCase().trim() },
  )

  if (!user?.mustSetPassword) {
    throw new Error('This account is already set up')
  }

  if (!user.phone || !phonesMatch(user.phone, phone)) {
    throw new Error('Phone number does not match our records')
  }
}

export async function completeAccountSetup(
  email: string,
  phone: string,
  password: string,
): Promise<SystemUser> {
  if (!isSanityConfigured) {
    throw new Error('Sanity is not configured')
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const user = await getSanityClient().fetch<SystemUserWithHash | null>(
    `*[_type == "systemUser" && email == $email && isActive == true][0] {
      ${USER_FIELDS},
      passwordHash
    }`,
    { email: email.toLowerCase().trim() },
  )

  if (!user) {
    throw new Error('Account not found')
  }

  if (!user.mustSetPassword) {
    throw new Error('This account is already set up. Sign in with your password.')
  }

  if (!user.phone || !phonesMatch(user.phone, phone)) {
    throw new Error('Phone number does not match our records')
  }

  const passwordHash = await hashPassword(password)

  await getSanityClient()
    .patch(user._id)
    .set({ passwordHash, mustSetPassword: false })
    .commit()

  const { passwordHash: _, ...safeUser } = user
  return { ...safeUser, mustSetPassword: false }
}

export async function resetUserActivation(userId: string): Promise<SystemUser> {
  if (!isSanityConfigured) {
    throw new Error('Sanity is not configured')
  }

  const passwordHash = await hashPassword(`RESET_${crypto.randomUUID()}_${Date.now()}`)

  await getSanityClient()
    .patch(userId)
    .set({ mustSetPassword: true, passwordHash })
    .commit()

  return getSanityClient().fetch<SystemUser>(
    `*[_type == "systemUser" && _id == $id][0] { ${USER_FIELDS} }`,
    { id: userId },
  )
}

export interface RegisterSystemUserInput {
  email: string
  password?: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  permissions?: Permission[]
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function createPendingPasswordHash(): Promise<string> {
  return hashPassword(`PENDING_${crypto.randomUUID()}_${Date.now()}`)
}

export async function registerSuperAdmin(
  input: Omit<RegisterSystemUserInput, 'role'>,
): Promise<SystemUser> {
  if (!isSanityConfigured) {
    throw new Error('Sanity is not configured')
  }

  const existing = await countSystemUsers()
  if (existing > 0) {
    throw new Error('A super admin already exists. Please sign in.')
  }

  if (!input.password || input.password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const passwordHash = await hashPassword(input.password)

  const doc = await getSanityClient().create({
    _type: 'systemUser',
    email: input.email.toLowerCase().trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone ? normalizePhone(input.phone) : undefined,
    mustSetPassword: false,
    role: 'super_admin',
    permissions: ALL_PERMISSIONS,
    passwordHash,
    isActive: true,
    createdAt: new Date().toISOString(),
  })

  return {
    _id: doc._id,
    email: input.email.toLowerCase().trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone ? normalizePhone(input.phone) : undefined,
    mustSetPassword: false,
    role: 'super_admin',
    permissions: ALL_PERMISSIONS,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
}

export async function registerSystemUser(input: RegisterSystemUserInput): Promise<SystemUser> {
  if (!isSanityConfigured) {
    throw new Error('Sanity is not configured')
  }

  if (!input.phone?.trim()) {
    throw new Error('Phone number is required for new users')
  }

  const existing = await getSanityClient().fetch(
    `*[_type == "systemUser" && email == $email][0]`,
    { email: input.email.toLowerCase().trim() },
  )
  if (existing) {
    throw new Error('A user with this email already exists')
  }

  const passwordHash = await createPendingPasswordHash()
  const phone = normalizePhone(input.phone)

  const doc = await getSanityClient().create({
    _type: 'systemUser',
    email: input.email.toLowerCase().trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone,
    mustSetPassword: true,
    role: input.role,
    permissions: input.permissions ?? [],
    passwordHash,
    isActive: true,
    createdAt: new Date().toISOString(),
  })

  return {
    _id: doc._id,
    email: input.email.toLowerCase().trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone,
    mustSetPassword: true,
    role: input.role,
    permissions: input.permissions,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
}

export interface UpdateSystemUserInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: UserRole
}

export async function updateSystemUser(
  userId: string,
  input: UpdateSystemUserInput,
): Promise<SystemUser> {
  if (!isSanityConfigured) {
    throw new Error('Sanity is not configured')
  }

  const email = input.email.toLowerCase().trim()
  const duplicate = await getSanityClient().fetch<{ _id: string } | null>(
    `*[_type == "systemUser" && email == $email && _id != $id][0]{ _id }`,
    { email, id: userId },
  )
  if (duplicate) {
    throw new Error('Another user already uses this email')
  }

  await getSanityClient()
    .patch(userId)
    .set({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      phone: normalizePhone(input.phone),
      role: input.role,
    })
    .commit()

  return getSanityClient().fetch<SystemUser>(
    `*[_type == "systemUser" && _id == $id][0] { ${USER_FIELDS} }`,
    { id: userId },
  )
}

export async function deleteSystemUser(userId: string): Promise<void> {
  if (!isSanityConfigured) {
    throw new Error('Sanity is not configured')
  }

  await getSanityClient().patch(userId).set({ isActive: false }).commit()
}

export async function updateUserPermissions(
  userId: string,
  permissions: Permission[],
): Promise<SystemUser> {
  if (!isSanityConfigured) {
    throw new Error('Sanity is not configured')
  }

  await getSanityClient().patch(userId).set({ permissions }).commit()

  return getSanityClient().fetch<SystemUser>(
    `*[_type == "systemUser" && _id == $id][0] { ${USER_FIELDS} }`,
    { id: userId },
  )
}
