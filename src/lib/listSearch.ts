import { getDepartmentLabel } from './types'
import type { AttendanceRecord, AuthUser, Employee, PayrollLine } from './types'

export function matchesEmployee(employee: Employee, query: string): boolean {
  const q = query.toLowerCase()
  return (
    employee.firstName.toLowerCase().includes(q) ||
    employee.lastName.toLowerCase().includes(q) ||
    employee.email.toLowerCase().includes(q) ||
    employee.employeeId.toLowerCase().includes(q) ||
    employee.jobTitle.toLowerCase().includes(q)
  )
}

export function matchesAuthUser(user: AuthUser, query: string): boolean {
  const q = query.toLowerCase()
  return (
    user.firstName.toLowerCase().includes(q) ||
    user.lastName.toLowerCase().includes(q) ||
    user.email.toLowerCase().includes(q) ||
    (user.employeeId?.toLowerCase().includes(q) ?? false)
  )
}

export function matchesPayrollLine(line: PayrollLine, query: string): boolean {
  const q = query.toLowerCase()
  const e = line.employee
  return (
    e.firstName.toLowerCase().includes(q) ||
    e.lastName.toLowerCase().includes(q) ||
    e.employeeId.toLowerCase().includes(q) ||
    e.jobTitle.toLowerCase().includes(q)
  )
}

export function matchesAttendanceRecord(record: AttendanceRecord, query: string): boolean {
  const q = query.toLowerCase()
  const e = record.employee
  return (
    e.firstName.toLowerCase().includes(q) ||
    e.lastName.toLowerCase().includes(q) ||
    e.employeeId.toLowerCase().includes(q) ||
    getDepartmentLabel(e.department).toLowerCase().includes(q)
  )
}
