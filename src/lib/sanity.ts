import bcrypt from 'bcryptjs'
import { normalizePhone } from './phone'
import type {
  AttendanceLocation,
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  EmploymentType,
  PayHistoryEntry,
  PaymentMethod,
} from './types'
import { getNextEmployeeIdFromList } from './employeeId'
import { getUKNow, getUKToday } from './uk'
import { MOCK_ATTENDANCE, MOCK_EMPLOYEES, MOCK_DEPARTMENTS } from './mockData'
import { getSanityClient, isSanityConfigured } from './sanity/client'
import { assignEmployeeToDepartment } from './sanity/departments'

export { isSanityConfigured }
export { assignEmployeeToDepartment }

function getClient() {
  return getSanityClient()
}

const DEPT_FIELDS = `_id, name, "slug": slug.current, color, isActive`

const ATTENDANCE_LOCATION_FIELDS = `
  signInLocation { latitude, longitude, accuracy, capturedAt },
  signOutLocation { latitude, longitude, accuracy, capturedAt }
`

const ROLE_FIELDS = `_id, slug, name, color, permissions, isSystem, rank, updatedAt, role`

const EMPLOYEE_FIELDS = `
  _id,
  employeeId,
  firstName,
  lastName,
  email,
  jobTitle,
  description,
  phone,
  startDate,
  employmentType,
  paymentMethod,
  payRate,
  hoursPerWeek,
  payHistory,
  mustSetPassword,
  permissions,
  createdAt,
  isActive,
  avatarUrl,
  "department": department->{ ${DEPT_FIELDS} },
  "role": role->{ ${ROLE_FIELDS} }
`

const ATTENDANCE_RECORD_FIELDS = `
  _id,
  signInTime,
  signOutTime,
  status,
  date,
  notes,
  ${ATTENDANCE_LOCATION_FIELDS},
  "employee": employee->{ ${EMPLOYEE_FIELDS} }
`

export async function fetchEmployees(): Promise<Employee[]> {
  if (!isSanityConfigured) return MOCK_EMPLOYEES

  return getClient().fetch<Employee[]>(
    `*[_type == "employee" && isActive == true] | order(firstName asc) { ${EMPLOYEE_FIELDS} }`,
  )
}

export async function fetchEmployeeById(id: string): Promise<Employee | null> {
  if (!isSanityConfigured) {
    return MOCK_EMPLOYEES.find((e) => e._id === id) ?? null
  }

  return getClient().fetch<Employee | null>(
    `*[_type == "employee" && _id == $id][0] { ${EMPLOYEE_FIELDS} }`,
    { id },
  )
}

export async function generateNextEmployeeId(): Promise<string> {
  if (!isSanityConfigured) {
    return getNextEmployeeIdFromList(MOCK_EMPLOYEES.map((e) => e.employeeId))
  }

  const ids = await getClient().fetch<string[]>(`*[_type == "employee"].employeeId`)
  return getNextEmployeeIdFromList(ids)
}

export interface CreateEmployeeInput {
  firstName: string
  lastName: string
  email: string
  departmentId: string
  jobTitle: string
  roleId: string
  description?: string
  phone: string
  startDate: string
  employmentType: EmploymentType
  paymentMethod: PaymentMethod
  payRate: number
  hoursPerWeek?: number
  payEffectiveFrom?: string
}

async function createPendingPasswordHash(): Promise<string> {
  return bcrypt.hash(`PENDING_${crypto.randomUUID()}_${Date.now()}`, 10)
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const employeeId = await generateNextEmployeeId()
  const now = getUKNow()
  const effectiveFrom = input.payEffectiveFrom ?? input.startDate
  const initialHistory: PayHistoryEntry = {
    payRate: input.payRate,
    paymentMethod: input.paymentMethod,
    employmentType: input.employmentType,
    hoursPerWeek: input.hoursPerWeek,
    effectiveFrom,
    changedAt: now,
    note: 'Initial pay on registration',
  }

  if (!isSanityConfigured) {
    const dept = MOCK_DEPARTMENTS.find((d) => d._id === input.departmentId) ?? null
    const newEmployee: Employee = {
      _id: `mock-${Date.now()}`,
      employeeId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      department: dept,
      jobTitle: input.jobTitle,
      description: input.description,
      phone: input.phone,
      startDate: input.startDate,
      employmentType: input.employmentType,
      paymentMethod: input.paymentMethod,
      payRate: input.payRate,
      hoursPerWeek: input.hoursPerWeek,
      payHistory: [initialHistory],
      isActive: true,
    }
    MOCK_EMPLOYEES.push(newEmployee)
    return newEmployee
  }

  const passwordHash = await createPendingPasswordHash()
  const phone = normalizePhone(input.phone)

  const doc = await getClient().create({
    _type: 'employee',
    employeeId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email.toLowerCase().trim(),
    department: { _type: 'reference', _ref: input.departmentId },
    jobTitle: input.jobTitle,
    description: input.description,
    phone,
    startDate: input.startDate,
    employmentType: input.employmentType,
    paymentMethod: input.paymentMethod,
    payRate: input.payRate,
    hoursPerWeek: input.hoursPerWeek,
    payHistory: [initialHistory],
    role: { _type: 'reference', _ref: input.roleId },
    passwordHash,
    mustSetPassword: true,
    permissions: [],
    createdAt: now,
    isActive: true,
  })

  return fetchEmployeeById(doc._id) as Promise<Employee>
}

export interface UpdateEmployeeInput {
  firstName: string
  lastName: string
  email: string
  departmentId: string
  jobTitle: string
  roleId: string
  description?: string
  phone: string
  startDate: string
  employmentType: EmploymentType
  paymentMethod: PaymentMethod
  payRate: number
  hoursPerWeek?: number
}

export async function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput,
): Promise<Employee> {
  if (!isSanityConfigured) {
    const idx = MOCK_EMPLOYEES.findIndex((e) => e._id === employeeId)
    if (idx < 0) throw new Error('Employee not found')
    const dept = MOCK_DEPARTMENTS.find((d) => d._id === input.departmentId) ?? null
    MOCK_EMPLOYEES[idx] = {
      ...MOCK_EMPLOYEES[idx],
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      department: dept,
      jobTitle: input.jobTitle,
      description: input.description,
      phone: input.phone,
      startDate: input.startDate,
      employmentType: input.employmentType,
      paymentMethod: input.paymentMethod,
      payRate: input.payRate,
      hoursPerWeek: input.hoursPerWeek,
    }
    return MOCK_EMPLOYEES[idx]
  }

  await getClient()
    .patch(employeeId)
    .set({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase().trim(),
      department: { _type: 'reference', _ref: input.departmentId },
      jobTitle: input.jobTitle,
      description: input.description,
      phone: normalizePhone(input.phone),
      startDate: input.startDate,
      employmentType: input.employmentType,
      paymentMethod: input.paymentMethod,
      payRate: input.payRate,
      hoursPerWeek: input.hoursPerWeek,
      role: { _type: 'reference', _ref: input.roleId },
    })
    .commit()

  return fetchEmployeeById(employeeId) as Promise<Employee>
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  if (!isSanityConfigured) {
    const emp = MOCK_EMPLOYEES.find((e) => e._id === employeeId)
    if (emp) emp.isActive = false
    const idx = MOCK_EMPLOYEES.findIndex((e) => e._id === employeeId)
    if (idx >= 0) MOCK_EMPLOYEES.splice(idx, 1)
    return
  }

  await getClient().patch(employeeId).set({ isActive: false }).commit()
}

export interface UpdateEmployeePayInput {
  employmentType: EmploymentType
  paymentMethod: PaymentMethod
  payRate: number
  hoursPerWeek?: number
  effectiveFrom: string
  note?: string
}

export async function updateEmployeePay(
  employeeId: string,
  input: UpdateEmployeePayInput,
): Promise<Employee> {
  const now = getUKNow()
  const entry: PayHistoryEntry = {
    payRate: input.payRate,
    paymentMethod: input.paymentMethod,
    employmentType: input.employmentType,
    hoursPerWeek: input.hoursPerWeek,
    effectiveFrom: input.effectiveFrom,
    changedAt: now,
    note: input.note,
  }

  if (!isSanityConfigured) {
    const employee = MOCK_EMPLOYEES.find((e) => e._id === employeeId)
    if (!employee) throw new Error('Employee not found')

    employee.employmentType = input.employmentType
    employee.paymentMethod = input.paymentMethod
    employee.payRate = input.payRate
    employee.hoursPerWeek = input.hoursPerWeek
    employee.payHistory = [...(employee.payHistory ?? []), entry]
    return employee
  }

  const existing = await fetchEmployeeById(employeeId)
  if (!existing) throw new Error('Employee not found')

  const payHistory = [...(existing.payHistory ?? []), entry]

  await getClient()
    .patch(employeeId)
    .set({
      employmentType: input.employmentType,
      paymentMethod: input.paymentMethod,
      payRate: input.payRate,
      hoursPerWeek: input.hoursPerWeek,
      payHistory,
    })
    .commit()

  return fetchEmployeeById(employeeId) as Promise<Employee>
}

/** Mark previous-day open sign-ins as forgot sign out (needs manual fix before payroll). */
export async function closeStaleAttendanceRecords(employeeId?: string): Promise<void> {
  const today = getUKToday()

  if (!isSanityConfigured) {
    for (const record of MOCK_ATTENDANCE) {
      if (record.status !== 'signed_in' || record.date >= today) continue
      if (employeeId && record.employee._id !== employeeId) continue
      record.status = 'forgot_sign_out'
      record.signOutTime = undefined
    }
    return
  }

  const params: Record<string, string> = { today }
  let employeeFilter = ''
  if (employeeId) {
    employeeFilter = ' && employee._ref == $employeeId'
    params.employeeId = employeeId
  }

  const stale = await getClient().fetch<{ _id: string }[]>(
    `*[_type == "attendance" && status == "signed_in" && date < $today${employeeFilter}] { _id }`,
    params,
  )

  for (const row of stale) {
    await getClient()
      .patch(row._id)
      .set({ status: 'forgot_sign_out', signOutTime: null, signOutLocation: null })
      .commit()
  }
}

export async function fetchForgotSignOutInPeriod(
  periodStart: string,
  periodEnd: string,
): Promise<AttendanceRecord[]> {
  await closeStaleAttendanceRecords()

  if (!isSanityConfigured) {
    return MOCK_ATTENDANCE.filter(
      (a) =>
        a.status === 'forgot_sign_out' &&
        a.date >= periodStart &&
        a.date <= periodEnd,
    ).sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.employee.employeeId.localeCompare(b.employee.employeeId),
    )
  }

  return getClient().fetch<AttendanceRecord[]>(
    `*[_type == "attendance" && status == "forgot_sign_out" && date >= $start && date <= $end]
      | order(date asc, employee->employeeId asc) { ${ATTENDANCE_RECORD_FIELDS} }`,
    { start: periodStart, end: periodEnd },
  )
}

export async function resolveForgotSignOut(
  attendanceId: string,
  signOutTime: string,
): Promise<AttendanceRecord> {
  if (!isSanityConfigured) {
    const record = MOCK_ATTENDANCE.find((a) => a._id === attendanceId)
    if (!record || record.status !== 'forgot_sign_out') {
      throw new Error('Record not found or not awaiting sign out')
    }
    record.status = 'signed_out'
    record.signOutTime = signOutTime
    return record
  }

  await getClient()
    .patch(attendanceId)
    .set({ status: 'signed_out', signOutTime })
    .commit()

  const record = await getClient().fetch<AttendanceRecord | null>(
    `*[_type == "attendance" && _id == $id][0] { ${ATTENDANCE_RECORD_FIELDS} }`,
    { id: attendanceId },
  )
  if (!record) throw new Error('Failed to load attendance after update')
  return record
}

export async function fetchTodayAttendance(): Promise<AttendanceRecord[]> {
  const today = getUKToday()
  await closeStaleAttendanceRecords()

  if (!isSanityConfigured) {
    return MOCK_ATTENDANCE.filter((a) => a.date === today)
  }

  return getClient().fetch<AttendanceRecord[]>(
    `*[_type == "attendance" && date == $today] | order(signInTime desc) { ${ATTENDANCE_RECORD_FIELDS} }`,
    { today },
  )
}

export async function fetchRecentAttendance(limit = 20): Promise<AttendanceRecord[]> {
  if (!isSanityConfigured) {
    return [...MOCK_ATTENDANCE].sort(
      (a, b) => new Date(b.signInTime).getTime() - new Date(a.signInTime).getTime(),
    ).slice(0, limit)
  }

  return getClient().fetch<AttendanceRecord[]>(
    `*[_type == "attendance"] | order(signInTime desc) [0...$limit] { ${ATTENDANCE_RECORD_FIELDS} }`,
    { limit },
  )
}

export async function signInEmployee(
  employeeId: string,
  signInLocation?: AttendanceLocation,
): Promise<AttendanceRecord> {
  const today = getUKToday()
  const now = getUKNow()
  await closeStaleAttendanceRecords(employeeId)

  if (!isSanityConfigured) {
    const employee = MOCK_EMPLOYEES.find((e) => e._id === employeeId)
    if (!employee) throw new Error('Employee not found')

    const existing = MOCK_ATTENDANCE.find(
      (a) => a.employee._id === employeeId && a.date === today && a.status === 'signed_in',
    )
    if (existing) throw new Error('Already signed in today')

    const record: AttendanceRecord = {
      _id: `att-${Date.now()}`,
      employee,
      signInTime: now,
      status: 'signed_in',
      date: today,
      signInLocation,
    }
    MOCK_ATTENDANCE.unshift(record)
    return record
  }

  const existing = await getClient().fetch(
    `*[_type == "attendance" && employee._ref == $employeeId && date == $today && status == "signed_in"][0]`,
    { employeeId, today },
  )
  if (existing) throw new Error('Already signed in today')

  const doc = await getClient().create({
    _type: 'attendance',
    employee: { _type: 'reference', _ref: employeeId },
    signInTime: now,
    status: 'signed_in' as AttendanceStatus,
    date: today,
    signInLocation,
  })

  const record = await getClient().fetch<AttendanceRecord | null>(
    `*[_type == "attendance" && _id == $id][0] { ${ATTENDANCE_RECORD_FIELDS} }`,
    { id: doc._id },
  )
  if (!record) throw new Error('Failed to load attendance record after sign in')
  return record
}

export async function signOutEmployee(
  attendanceId: string,
  signOutLocation?: AttendanceLocation,
): Promise<AttendanceRecord> {
  const now = getUKNow()

  if (!isSanityConfigured) {
    const record = MOCK_ATTENDANCE.find((a) => a._id === attendanceId)
    if (!record) throw new Error('Attendance record not found')
    if (record.status === 'signed_out') throw new Error('Already signed out')

    record.signOutTime = now
    record.status = 'signed_out'
    record.signOutLocation = signOutLocation
    return record
  }

  await getClient()
    .patch(attendanceId)
    .set({ signOutTime: now, status: 'signed_out', signOutLocation })
    .commit()

  return getClient().fetch<AttendanceRecord>(
    `*[_type == "attendance" && _id == $id][0] { ${ATTENDANCE_RECORD_FIELDS} }`,
    { id: attendanceId },
  )
}

export async function fetchEmployeeAttendanceHistory(
  employeeId: string,
  startDate?: string,
  endDate?: string,
): Promise<AttendanceRecord[]> {
  await closeStaleAttendanceRecords(employeeId)

  if (!isSanityConfigured) {
    return MOCK_ATTENDANCE.filter((a) => {
      if (a.employee._id !== employeeId) return false
      if (startDate && a.date < startDate) return false
      if (endDate && a.date > endDate) return false
      return true
    }).sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        new Date(a.signInTime).getTime() - new Date(b.signInTime).getTime(),
    )
  }

  const params: Record<string, string> = { employeeId }
  let dateFilter = ''

  if (startDate && endDate) {
    dateFilter = ' && date >= $start && date <= $end'
    params.start = startDate
    params.end = endDate
  } else if (startDate) {
    dateFilter = ' && date >= $start'
    params.start = startDate
  } else if (endDate) {
    dateFilter = ' && date <= $end'
    params.end = endDate
  }

  return getClient().fetch<AttendanceRecord[]>(
    `*[_type == "attendance" && employee._ref == $employeeId${dateFilter}]
      | order(date asc, signInTime asc) { ${ATTENDANCE_RECORD_FIELDS} }`,
    params,
  )
}

export async function fetchAllAttendanceHistory(
  startDate: string,
  endDate: string,
): Promise<AttendanceRecord[]> {
  if (!isSanityConfigured) {
    return MOCK_ATTENDANCE.filter(
      (a) => a.date >= startDate && a.date <= endDate,
    ).sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.employee.employeeId.localeCompare(b.employee.employeeId),
    )
  }

  return getClient().fetch<AttendanceRecord[]>(
    `*[_type == "attendance" && date >= $start && date <= $end]
      | order(employee->employeeId asc, date asc, signInTime asc) { ${ATTENDANCE_RECORD_FIELDS} }`,
    { start: startDate, end: endDate },
  )
}

export async function getEmployeeActiveAttendance(employeeId: string): Promise<AttendanceRecord | null> {
  const today = getUKToday()

  if (!isSanityConfigured) {
    return (
      MOCK_ATTENDANCE.find(
        (a) => a.employee._id === employeeId && a.date === today && a.status === 'signed_in',
      ) ?? null
    )
  }

  return getClient().fetch<AttendanceRecord | null>(
    `*[_type == "attendance" && employee._ref == $employeeId && date == $today && status == "signed_in"][0] { ${ATTENDANCE_RECORD_FIELDS} }`,
    { employeeId, today },
  )
}
