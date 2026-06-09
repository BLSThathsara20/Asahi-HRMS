import { format, formatDistanceToNow } from 'date-fns'
import { enGB } from 'date-fns/locale'

const UK_TIMEZONE = 'Europe/London'

export function formatUKDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy', { locale: enGB })
}

export function formatUKTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

export function formatUKDateTime(date: string | Date): string {
  return `${formatUKDate(date)} ${formatUKTime(date)}`
}

export function formatRelativeUK(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: enGB })
}

export function getUKToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: UK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function getUKNow(): string {
  return new Date().toISOString()
}

export function getCurrentUKYearMonth(): string {
  return getUKToday().slice(0, 7)
}

export function getUKMonthRange(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split('-').map(Number)
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export function formatUKMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)
}
