export type UserRole = 'super_admin' | 'admin' | 'manager'

export type EmploymentType = 'part_time' | 'full_time'
export type PaymentMethod = 'hourly' | 'daily' | 'monthly'
export type PayrollStatus = 'pending' | 'paid'

export type Permission =
  | 'dashboard.view'
  | 'dashboard.stats'
  | 'dashboard.attendance'
  | 'dashboard.departments'
  | 'departments.manage'
  | 'attendance.view'
  | 'attendance.manage'
  | 'attendance.export'
  | 'employees.view'
  | 'employees.register'
  | 'employees.manage_pay'
  | 'users.view'
  | 'users.register'
  | 'users.edit'
  | 'users.delete'
  | 'users.manage_permissions'
  | 'users.reset_activation'
  | 'employees.edit'
  | 'employees.delete'
  | 'roles.view'
  | 'roles.manage'
  | 'finance.view'
  | 'finance.manage'
  | 'finance.mark_paid'

export interface RoleConfig {
  _id: string
  role: UserRole
  permissions: Permission[]
  updatedAt: string
}

export interface SystemUser {
  _id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  mustSetPassword?: boolean
  role: UserRole
  permissions?: Permission[]
  isActive: boolean
  createdAt: string
}

export type LoginCheckStatus =
  | { status: 'not_found' }
  | { status: 'pending_setup'; firstName: string }
  | { status: 'active'; firstName: string }

export interface Department {
  _id: string
  name: string
  slug: string
  color: string
  isActive: boolean
  createdAt?: string
}

export type AttendanceStatus = 'signed_in' | 'signed_out'

export interface Employee {
  _id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  department: Department | null
  jobTitle: string
  description?: string
  phone?: string
  startDate: string
  employmentType?: EmploymentType
  paymentMethod?: PaymentMethod
  payRate?: number
  hoursPerWeek?: number
  payHistory?: PayHistoryEntry[]
  isActive: boolean
  avatarUrl?: string
}

export interface PayHistoryEntry {
  payRate: number
  paymentMethod: PaymentMethod
  employmentType: EmploymentType
  hoursPerWeek?: number
  effectiveFrom: string
  changedAt: string
  note?: string
}

export interface PayrollEntry {
  _id: string
  employee: Employee
  periodStart: string
  periodEnd: string
  grossPay: number
  hoursWorked?: number
  daysWorked?: number
  employmentType?: EmploymentType
  paymentMethod?: PaymentMethod
  payRate?: number
  status: PayrollStatus
  paidAt?: string
  notes?: string
  updatedAt?: string
}

export interface PayrollLine {
  employee: Employee
  hoursWorked: number
  daysWorked: number
  grossPay: number
  paymentMethod?: PaymentMethod
  payRate?: number
  employmentType?: EmploymentType
  entryId?: string
  status: PayrollStatus
  paidAt?: string
  configured: boolean
}

export interface AttendanceLocation {
  latitude: number
  longitude: number
  accuracy?: number
  capturedAt: string
}

export interface AttendanceRecord {
  _id: string
  employee: Employee
  signInTime: string
  signOutTime?: string
  status: AttendanceStatus
  date: string
  notes?: string
  signInLocation?: AttendanceLocation
  signOutLocation?: AttendanceLocation
}

export function getDepartmentLabel(dept: Department | null | undefined): string {
  return dept?.name ?? 'Unassigned'
}

export function getDepartmentColor(dept: Department | null | undefined): string {
  return dept?.color ?? '#64748b'
}
