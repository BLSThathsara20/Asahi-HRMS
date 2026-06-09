import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { enGB } from 'date-fns/locale'
import type { AttendanceRecord } from './types'

export type DayAttendanceStatus = 'none' | 'present' | 'signed_in' | 'forgot_sign_out'

export function buildAttendanceDayMap(
  records: AttendanceRecord[],
): Map<string, DayAttendanceStatus> {
  const map = new Map<string, DayAttendanceStatus>()
  for (const record of records) {
    if (record.status === 'forgot_sign_out') {
      map.set(record.date, 'forgot_sign_out')
    } else if (record.status === 'signed_out') {
      map.set(record.date, 'present')
    } else if (!map.has(record.date) || map.get(record.date) === 'none') {
      map.set(record.date, 'signed_in')
    }
  }
  return map
}

export function countPresentDays(map: Map<string, DayAttendanceStatus>): number {
  let count = 0
  for (const status of map.values()) {
    if (status === 'present' || status === 'signed_in' || status === 'forgot_sign_out') count++
  }
  return count
}

/** Monday-first week labels for UK */
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function getMonthCalendarDays(yearMonth: string): {
  date: string
  day: number
  inMonth: boolean
}[] {
  const [year, month] = yearMonth.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, month - 1, 1))
  const monthEnd = endOfMonth(monthStart)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Monday = 0 padding offset (JS getDay: Sun=0)
  const startPad = (getDay(monthStart) + 6) % 7
  const cells: { date: string; day: number; inMonth: boolean }[] = []

  for (let i = 0; i < startPad; i++) {
    cells.push({ date: '', day: 0, inMonth: false })
  }

  for (const d of days) {
    cells.push({
      date: format(d, 'yyyy-MM-dd'),
      day: d.getDate(),
      inMonth: true,
    })
  }

  return cells
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  const shifted = delta < 0 ? subMonths(d, Math.abs(delta)) : addMonths(d, delta)
  return format(shifted, 'yyyy-MM')
}

export function formatMonthTitle(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  return format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: enGB })
}
