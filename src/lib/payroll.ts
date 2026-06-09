import type {
  AttendanceRecord,
  Employee,
  EmploymentType,
  PayHistoryEntry,
  PaymentMethod,
  PayrollLine,
  PayrollStatus,
} from './types'
import { formatGBP, formatUKDate, getUKToday } from './uk'

export const UK_FULL_TIME_HOURS = 37.5

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  monthly: 'Monthly',
}

export function getPayRateLabel(method: PaymentMethod): string {
  switch (method) {
    case 'hourly':
      return 'Hourly rate (£/hr)'
    case 'daily':
      return 'Daily rate (£/day)'
    case 'monthly':
      return 'Monthly salary (£/month)'
  }
}

export function hoursFromRecord(record: AttendanceRecord): number {
  if (!record.signOutTime) return 0
  const ms =
    new Date(record.signOutTime).getTime() - new Date(record.signInTime).getTime()
  return Math.max(0, ms / 3_600_000)
}

export interface EffectivePay {
  payRate: number
  paymentMethod: PaymentMethod
  employmentType: EmploymentType
  hoursPerWeek?: number
}

export function getEffectivePayForDate(employee: Employee, date: string): EffectivePay | null {
  if (!employee.paymentMethod || employee.payRate === undefined) return null

  const history = employee.payHistory ?? []
  if (history.length > 0) {
    const applicable = [...history]
      .filter((h) => h.effectiveFrom <= date)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]
    if (applicable) {
      return {
        payRate: applicable.payRate,
        paymentMethod: applicable.paymentMethod,
        employmentType: applicable.employmentType,
        hoursPerWeek: applicable.hoursPerWeek,
      }
    }
  }

  if (!isPayConfigured(employee)) return null

  return {
    payRate: employee.payRate ?? 0,
    paymentMethod: employee.paymentMethod,
    employmentType: employee.employmentType!,
    hoursPerWeek: employee.hoursPerWeek,
  }
}

export function formatPayHistoryEntry(entry: PayHistoryEntry): string {
  const method = PAYMENT_METHOD_LABELS[entry.paymentMethod]
  const amount = formatGBP(entry.payRate)
  return `${amount} (${method}) from ${formatUKDate(entry.effectiveFrom)}`
}

export function isPayConfigured(employee: Employee): boolean {
  return Boolean(
    employee.employmentType &&
      employee.paymentMethod &&
      employee.payRate !== undefined &&
      employee.payRate >= 0,
  )
}

export function getPayrollEffectiveEnd(periodStart: string, periodEnd: string): string {
  const today = getUKToday()
  if (today < periodStart) return periodStart
  if (today > periodEnd) return periodEnd
  return today
}

export function countDaysAttended(
  attendance: AttendanceRecord[],
  employeeId: string,
  periodStart: string,
  periodEnd: string,
): number {
  return new Set(
    attendance
      .filter(
        (a) =>
          a.employee._id === employeeId &&
          a.date >= periodStart &&
          a.date <= periodEnd,
      )
      .map((a) => a.date),
  ).size
}

export interface EmployeeEarnings {
  grossPay: number
  hoursWorked: number
  daysWorked: number
  daysAttended: number
  configured: boolean
  effectiveEnd: string
  isMonthToDate: boolean
}

export function calculateEmployeeEarningsToDate(
  employee: Employee,
  attendance: AttendanceRecord[],
  periodStart: string,
  periodEnd: string,
): EmployeeEarnings {
  const effectiveEnd = getPayrollEffectiveEnd(periodStart, periodEnd)
  const isMonthToDate = effectiveEnd < periodEnd

  if (!isPayConfigured(employee)) {
    return {
      grossPay: 0,
      hoursWorked: 0,
      daysWorked: 0,
      daysAttended: countDaysAttended(attendance, employee._id, periodStart, effectiveEnd),
      configured: false,
      effectiveEnd,
      isMonthToDate,
    }
  }

  const periodRecords = attendance.filter(
    (a) =>
      a.employee._id === employee._id &&
      a.date >= periodStart &&
      a.date <= effectiveEnd &&
      a.status === 'signed_out',
  )

  const hoursWorked = periodRecords.reduce((sum, r) => sum + hoursFromRecord(r), 0)
  const daysWorked = new Set(periodRecords.map((r) => r.date)).size
  const daysAttended = countDaysAttended(attendance, employee._id, periodStart, effectiveEnd)

  let grossPay = 0
  const pay = getEffectivePayForDate(employee, periodStart)

  if (pay?.paymentMethod === 'monthly') {
    let monthly = pay.payRate
    if (pay.employmentType === 'part_time' && pay.hoursPerWeek) {
      monthly = pay.payRate * (pay.hoursPerWeek / UK_FULL_TIME_HOURS)
    }
    if (isMonthToDate) {
      const [year, month] = periodStart.split('-').map(Number)
      const totalDays = new Date(year, month, 0).getDate()
      const elapsed = Number(effectiveEnd.split('-')[2])
      grossPay = monthly * (elapsed / totalDays)
    } else {
      grossPay = monthly
    }
  } else {
    for (const record of periodRecords) {
      const recordPay = getEffectivePayForDate(employee, record.date)
      if (!recordPay) continue
      if (recordPay.paymentMethod === 'hourly') {
        grossPay += hoursFromRecord(record) * recordPay.payRate
      } else if (recordPay.paymentMethod === 'daily') {
        grossPay += recordPay.payRate
      }
    }
  }

  return {
    grossPay: Math.round(grossPay * 100) / 100,
    hoursWorked: Math.round(hoursWorked * 100) / 100,
    daysWorked,
    daysAttended,
    configured: true,
    effectiveEnd,
    isMonthToDate,
  }
}

export function calculateEmployeeGross(
  employee: Employee,
  attendance: AttendanceRecord[],
  periodStart: string,
  periodEnd: string,
): { grossPay: number; hoursWorked: number; daysWorked: number; configured: boolean } {
  if (!isPayConfigured(employee)) {
    return { grossPay: 0, hoursWorked: 0, daysWorked: 0, configured: false }
  }

  const periodRecords = attendance.filter(
    (a) =>
      a.employee._id === employee._id &&
      a.date >= periodStart &&
      a.date <= periodEnd &&
      a.status === 'signed_out',
  )

  const hoursWorked = periodRecords.reduce((sum, r) => sum + hoursFromRecord(r), 0)
  const daysWorked = new Set(periodRecords.map((r) => r.date)).size

  let grossPay = 0
  const monthlyPay = getEffectivePayForDate(employee, periodStart)

  if (monthlyPay?.paymentMethod === 'monthly') {
    let monthly = monthlyPay.payRate
    if (monthlyPay.employmentType === 'part_time' && monthlyPay.hoursPerWeek) {
      monthly = monthlyPay.payRate * (monthlyPay.hoursPerWeek / UK_FULL_TIME_HOURS)
    }
    grossPay = monthly
  } else {
    for (const record of periodRecords) {
      const pay = getEffectivePayForDate(employee, record.date)
      if (!pay) continue
      if (pay.paymentMethod === 'hourly') {
        grossPay += hoursFromRecord(record) * pay.payRate
      } else if (pay.paymentMethod === 'daily') {
        grossPay += pay.payRate
      }
    }
  }

  return {
    grossPay: Math.round(grossPay * 100) / 100,
    hoursWorked: Math.round(hoursWorked * 100) / 100,
    daysWorked,
    configured: true,
  }
}

export function buildPayrollLines(
  employees: Employee[],
  attendance: AttendanceRecord[],
  periodStart: string,
  periodEnd: string,
  entries: {
    _id: string
    employeeId: string
    status: PayrollStatus
    paidAt?: string
    paidAmount?: number
    paidByName?: string
    paymentReference?: string
  }[] = [],
): PayrollLine[] {
  const entryByEmployee = new Map(entries.map((e) => [e.employeeId, e]))

  return employees.map((employee) => {
    const calc = calculateEmployeeGross(employee, attendance, periodStart, periodEnd)
    const entry = entryByEmployee.get(employee._id)

    return {
      employee,
      hoursWorked: calc.hoursWorked,
      daysWorked: calc.daysWorked,
      grossPay: calc.grossPay,
      paymentMethod: employee.paymentMethod,
      payRate: employee.payRate,
      employmentType: employee.employmentType,
      entryId: entry?._id,
      status: entry?.status ?? 'pending',
      paidAt: entry?.paidAt,
      paidAmount: entry?.paidAmount,
      paidByName: entry?.paidByName,
      paymentReference: entry?.paymentReference,
      configured: calc.configured,
    }
  })
}

export function formatPaySummary(line: PayrollLine): string {
  if (!line.configured) return 'Pay not configured'
  switch (line.paymentMethod) {
    case 'hourly':
      return `${line.hoursWorked}h × £${line.payRate?.toFixed(2)}/hr`
    case 'daily':
      return `${line.daysWorked} days × £${line.payRate?.toFixed(2)}/day`
    case 'monthly':
      if (line.employmentType === 'part_time' && line.employee.hoursPerWeek) {
        return `£${line.payRate?.toFixed(2)}/mo (part-time ${line.employee.hoursPerWeek}h/wk)`
      }
      return `£${line.payRate?.toFixed(2)}/month`
    default:
      return '—'
  }
}
