import { MOCK_ATTENDANCE } from '../mockData'
import { buildPayrollLines } from '../payroll'
import type { AttendanceRecord, Employee, PayrollEntry, PayrollLine, PayrollStatus } from '../types'
import { getSanityClient, isSanityConfigured } from './client'

const DEPT_FIELDS = `_id, name, "slug": slug.current, color, isActive`

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
  isActive,
  avatarUrl,
  "department": department->{ ${DEPT_FIELDS} }
`

const PAYROLL_FIELDS = `
  _id,
  periodStart,
  periodEnd,
  grossPay,
  hoursWorked,
  daysWorked,
  employmentType,
  paymentMethod,
  payRate,
  status,
  paidAt,
  notes,
  updatedAt,
  "employee": employee->{ ${EMPLOYEE_FIELDS} }
`

let mockPayrollEntries: PayrollEntry[] = []

export async function fetchAttendanceForPeriod(
  periodStart: string,
  periodEnd: string,
): Promise<AttendanceRecord[]> {
  if (!isSanityConfigured) {
    return MOCK_ATTENDANCE.filter(
      (a) => a.date >= periodStart && a.date <= periodEnd && a.status === 'signed_out',
    )
  }

  return getSanityClient().fetch<AttendanceRecord[]>(
    `*[_type == "attendance" && date >= $start && date <= $end && status == "signed_out"]
      | order(date asc) {
      _id,
      signInTime,
      signOutTime,
      status,
      date,
      "employee": employee->{ ${EMPLOYEE_FIELDS} }
    }`,
    { start: periodStart, end: periodEnd },
  )
}

export async function fetchPayrollEntries(
  periodStart: string,
  periodEnd: string,
): Promise<PayrollEntry[]> {
  if (!isSanityConfigured) {
    return mockPayrollEntries.filter(
      (e) => e.periodStart === periodStart && e.periodEnd === periodEnd,
    )
  }

  return getSanityClient().fetch<PayrollEntry[]>(
    `*[_type == "payrollEntry" && periodStart == $start && periodEnd == $end]
      | order(employee->firstName asc) { ${PAYROLL_FIELDS} }`,
    { start: periodStart, end: periodEnd },
  )
}

export async function generatePayroll(
  employees: Employee[],
  periodStart: string,
  periodEnd: string,
): Promise<PayrollLine[]> {
  const [attendance, entries] = await Promise.all([
    fetchAttendanceForPeriod(periodStart, periodEnd),
    fetchPayrollEntries(periodStart, periodEnd),
  ])

  const lines = buildPayrollLines(
    employees,
    attendance,
    periodStart,
    periodEnd,
    entries.map((e) => ({
      _id: e._id,
      employeeId: e.employee._id,
      status: e.status,
      paidAt: e.paidAt,
    })),
  )

  if (!isSanityConfigured) {
    for (const line of lines) {
      if (!line.configured) continue
      const existing = mockPayrollEntries.find(
        (e) =>
          e.employee._id === line.employee._id &&
          e.periodStart === periodStart &&
          e.periodEnd === periodEnd,
      )
      if (existing) {
        existing.grossPay = line.grossPay
        existing.hoursWorked = line.hoursWorked
        existing.daysWorked = line.daysWorked
        existing.updatedAt = new Date().toISOString()
        line.entryId = existing._id
        line.status = existing.status
        line.paidAt = existing.paidAt
      } else {
        const entry: PayrollEntry = {
          _id: `payroll-${Date.now()}-${line.employee._id}`,
          employee: line.employee,
          periodStart,
          periodEnd,
          grossPay: line.grossPay,
          hoursWorked: line.hoursWorked,
          daysWorked: line.daysWorked,
          employmentType: line.employmentType,
          paymentMethod: line.paymentMethod,
          payRate: line.payRate,
          status: 'pending',
          updatedAt: new Date().toISOString(),
        }
        mockPayrollEntries.push(entry)
        line.entryId = entry._id
      }
    }
    return lines
  }

  const now = new Date().toISOString()

  for (const line of lines) {
    if (!line.configured) continue

    const existing = entries.find((e) => e.employee._id === line.employee._id)

    if (existing) {
      await getSanityClient()
        .patch(existing._id)
        .set({
          grossPay: line.grossPay,
          hoursWorked: line.hoursWorked,
          daysWorked: line.daysWorked,
          employmentType: line.employmentType,
          paymentMethod: line.paymentMethod,
          payRate: line.payRate,
          updatedAt: now,
        })
        .commit()
      line.entryId = existing._id
      line.status = existing.status
      line.paidAt = existing.paidAt
    } else {
      const doc = await getSanityClient().create({
        _type: 'payrollEntry',
        employee: { _type: 'reference', _ref: line.employee._id },
        periodStart,
        periodEnd,
        grossPay: line.grossPay,
        hoursWorked: line.hoursWorked,
        daysWorked: line.daysWorked,
        employmentType: line.employmentType,
        paymentMethod: line.paymentMethod,
        payRate: line.payRate,
        status: 'pending',
        updatedAt: now,
      })
      line.entryId = doc._id
      line.status = 'pending'
    }
  }

  return lines
}

export async function updatePayrollStatus(
  entryId: string,
  status: PayrollStatus,
): Promise<void> {
  const now = new Date().toISOString()

  if (!isSanityConfigured) {
    const entry = mockPayrollEntries.find((e) => e._id === entryId)
    if (entry) {
      entry.status = status
      entry.paidAt = status === 'paid' ? now : undefined
      entry.updatedAt = now
    }
    return
  }

  await getSanityClient()
    .patch(entryId)
    .set({
      status,
      paidAt: status === 'paid' ? now : null,
      updatedAt: now,
    })
    .commit()
}

export async function loadPayrollPeriod(
  employees: Employee[],
  periodStart: string,
  periodEnd: string,
): Promise<PayrollLine[]> {
  const [attendance, entries] = await Promise.all([
    fetchAttendanceForPeriod(periodStart, periodEnd),
    fetchPayrollEntries(periodStart, periodEnd),
  ])

  return buildPayrollLines(
    employees,
    attendance,
    periodStart,
    periodEnd,
    entries.map((e) => ({
      _id: e._id,
      employeeId: e.employee._id,
      status: e.status,
      paidAt: e.paidAt,
    })),
  )
}
