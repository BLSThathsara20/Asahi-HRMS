/**
 * Migrates legacy systemUser + roleConfig → unified employee model.
 * Run: node scripts/migrate-unified-users.mjs
 */
import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1)]
    }),
)

const client = createClient({
  projectId: env.VITE_SANITY_PROJECT_ID,
  dataset: env.VITE_SANITY_DATASET,
  apiVersion: env.VITE_SANITY_API_VERSION,
  token: env.VITE_SANITY_TOKEN,
  useCdn: false,
})

const SYSTEM_SEEDS = {
  super_admin: { name: 'Super Admin', color: '#7c3aed', rank: 100, isSystem: true },
  admin: { name: 'Admin', color: '#1a6fd4', rank: 50, isSystem: true },
  manager: { name: 'Manager', color: '#059669', rank: 10, isSystem: true },
}

async function hashPending() {
  return bcrypt.hash(`PENDING_${crypto.randomUUID()}_${Date.now()}`, 10)
}

async function upgradeRoleConfigs() {
  const roles = await client.fetch(`*[_type == "roleConfig"]`)
  for (const role of roles) {
    const slug = role.slug ?? role.role
    const seed = SYSTEM_SEEDS[slug]
    await client
      .patch(role._id)
      .set({
        slug,
        name: role.name ?? seed?.name ?? slug,
        color: role.color ?? seed?.color ?? '#64748b',
        rank: role.rank ?? seed?.rank ?? 5,
        isSystem: role.isSystem ?? Boolean(seed),
        role: slug,
        updatedAt: role.updatedAt ?? new Date().toISOString(),
      })
      .commit()
    console.log(`Upgraded roleConfig: ${slug}`)
  }
}

async function getRoleRef(slug) {
  const role = await client.fetch(`*[_type == "roleConfig" && (slug == $slug || role == $slug)][0]`, {
    slug,
  })
  return role?._id
}

async function migrateSystemUsers() {
  const systemUsers = await client.fetch(`*[_type == "systemUser" && isActive == true]`)
  const managerRoleId = await getRoleRef('manager')

  for (const su of systemUsers) {
    const roleId = (await getRoleRef(su.role)) ?? managerRoleId
    const employee = await client.fetch(`*[_type == "employee" && email == $email][0]`, {
      email: su.email,
    })

    if (employee) {
      await client
        .patch(employee._id)
        .set({
          role: { _type: 'reference', _ref: roleId },
          passwordHash: su.passwordHash,
          mustSetPassword: su.mustSetPassword ?? false,
          permissions: su.permissions ?? [],
          phone: su.phone ?? employee.phone,
          createdAt: su.createdAt ?? employee.createdAt ?? new Date().toISOString(),
        })
        .commit()
      console.log(`Merged systemUser into employee: ${su.email}`)
    } else {
      const dept = await client.fetch(`*[_type == "department" && isActive == true][0]{ _id }`)
      const ids = await client.fetch(`*[_type == "employee"].employeeId`)
      const nextNum =
        ids.length > 0
          ? Math.max(...ids.map((id) => parseInt(String(id).replace(/\D/g, ''), 10) || 0)) + 1
          : 1
      const employeeId = `AG-${String(nextNum).padStart(3, '0')}`
      await client.create({
        _type: 'employee',
        employeeId,
        firstName: su.firstName,
        lastName: su.lastName,
        email: su.email,
        phone: su.phone,
        department: dept ? { _type: 'reference', _ref: dept._id } : undefined,
        jobTitle: su.role === 'super_admin' ? 'Super Admin' : 'Staff',
        startDate: new Date().toISOString().split('T')[0],
        employmentType: 'full_time',
        paymentMethod: 'monthly',
        payRate: 0,
        role: { _type: 'reference', _ref: roleId },
        passwordHash: su.passwordHash,
        mustSetPassword: su.mustSetPassword ?? false,
        permissions: su.permissions ?? [],
        isActive: true,
        createdAt: su.createdAt ?? new Date().toISOString(),
      })
      console.log(`Created employee from systemUser: ${su.email}`)
    }

    await client.patch(su._id).set({ isActive: false }).commit()
  }
}

async function enableLoginOnEmployeesWithoutRole() {
  const managerRoleId = await getRoleRef('manager')
  const employees = await client.fetch(
    `*[_type == "employee" && isActive == true && !defined(role)]`,
  )

  for (const emp of employees) {
    const passwordHash = emp.passwordHash ?? (await hashPending())
    await client
      .patch(emp._id)
      .set({
        role: { _type: 'reference', _ref: managerRoleId },
        passwordHash,
        mustSetPassword: emp.mustSetPassword ?? true,
        permissions: emp.permissions ?? [],
        createdAt: emp.createdAt ?? new Date().toISOString(),
      })
      .commit()
    console.log(`Enabled login on employee: ${emp.email}`)
  }
}

async function main() {
  console.log('Starting unified user migration...')
  await upgradeRoleConfigs()
  await migrateSystemUsers()
  await enableLoginOnEmployeesWithoutRole()
  console.log('Migration complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
