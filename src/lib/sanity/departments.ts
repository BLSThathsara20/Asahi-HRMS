import { getSanityClient, isSanityConfigured } from './client'
import { MOCK_EMPLOYEES } from '../mockData'
import type { Department } from '../types'

const DEPT_FIELDS = `_id, name, "slug": slug.current, color, isActive, createdAt`

let mockDepartments: Department[] = [
  { _id: 'dept-1', name: 'Management', slug: 'management', color: '#1a6fd4', isActive: true },
  { _id: 'dept-2', name: 'Mechanics', slug: 'mechanics', color: '#059669', isActive: true },
  { _id: 'dept-3', name: 'Marketing', slug: 'marketing', color: '#d97706', isActive: true },
  { _id: 'dept-4', name: 'Sales', slug: 'sales', color: '#7c3aed', isActive: true },
  { _id: 'dept-5', name: 'Admin', slug: 'admin', color: '#64748b', isActive: true },
]

export async function fetchDepartments(): Promise<Department[]> {
  if (!isSanityConfigured) return mockDepartments.filter((d) => d.isActive)

  return getSanityClient().fetch<Department[]>(
    `*[_type == "department" && isActive == true] | order(name asc) { ${DEPT_FIELDS} }`,
  )
}

export interface CreateDepartmentInput {
  name: string
  color: string
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  if (!isSanityConfigured) {
    const dept: Department = {
      _id: `dept-${Date.now()}`,
      name: input.name.trim(),
      slug: toSlug(input.name),
      color: input.color,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    mockDepartments.push(dept)
    return dept
  }

  const slug = toSlug(input.name)
  const existing = await getSanityClient().fetch(
    `*[_type == "department" && slug.current == $slug][0]`,
    { slug },
  )
  if (existing) throw new Error('A department with this name already exists')

  const doc = await getSanityClient().create({
    _type: 'department',
    name: input.name.trim(),
    slug: { _type: 'slug', current: slug },
    color: input.color,
    isActive: true,
    createdAt: new Date().toISOString(),
  })

  return {
    _id: doc._id,
    name: input.name.trim(),
    slug,
    color: input.color,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  if (!isSanityConfigured) {
    mockDepartments = mockDepartments.filter((d) => d._id !== departmentId)
    return
  }

  const empCount = await getSanityClient().fetch<number>(
    `count(*[_type == "employee" && department._ref == $id && isActive == true])`,
    { id: departmentId },
  )
  if (empCount > 0) {
    throw new Error(`Cannot delete: ${empCount} employee(s) still assigned. Reassign them first.`)
  }

  await getSanityClient().patch(departmentId).set({ isActive: false }).commit()
}

export async function assignEmployeeToDepartment(
  employeeId: string,
  departmentId: string,
): Promise<void> {
  if (!isSanityConfigured) {
    const emp = MOCK_EMPLOYEES.find((e) => e._id === employeeId)
    const dept = mockDepartments.find((d) => d._id === departmentId)
    if (emp && dept) emp.department = dept
    return
  }

  await getSanityClient()
    .patch(employeeId)
    .set({ department: { _type: 'reference', _ref: departmentId } })
    .commit()
}
