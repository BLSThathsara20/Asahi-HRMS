const UK_TIMEZONE = 'Europe/London'

export type OfficeHoursPhase = 'before' | 'open' | 'after'

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export interface UKTimeParts {
  weekday: number
  hour: number
  minute: number
}

export function getUKTimeParts(date = new Date()): UKTimeParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIMEZONE,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date)

  const weekday =
    WEEKDAY_MAP[parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'] ?? 1
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)

  return { weekday, hour, minute }
}

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute
}

export function getOfficeHoursForDay(weekday: number): { open: number; close: number } | null {
  if (weekday === 0) {
    return { open: toMinutes(12, 30), close: toMinutes(15, 30) }
  }
  if (weekday >= 1 && weekday <= 6) {
    return { open: toMinutes(10, 0), close: toMinutes(19, 0) }
  }
  return null
}

export function formatMinutesAsTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function ukWeekdayFromDate(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const short = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIMEZONE,
    weekday: 'short',
  }).format(noonUtc)
  return WEEKDAY_MAP[short] ?? 1
}

/** Convert a UK calendar date + wall-clock time to an ISO UTC string. */
export function ukDateTimeToIso(ukDate: string, hour: number, minute: number): string {
  const [y, m, d] = ukDate.split('-').map(Number)
  const start = Date.UTC(y, m - 1, d - 1, 0, 0, 0)
  const end = Date.UTC(y, m - 1, d + 1, 23, 59, 59)

  for (let t = start; t <= end; t += 60_000) {
    const instant = new Date(t)
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: UK_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(instant)
    if (dateStr !== ukDate) continue
    const parts = getUKTimeParts(instant)
    if (parts.hour === hour && parts.minute === minute) {
      return instant.toISOString()
    }
  }

  return new Date(Date.UTC(y, m - 1, d, 19, 0, 0)).toISOString()
}

/** Auto sign-out time for a missed clock-out (office close on that UK date). */
export function getAutoSignOutIsoForDate(date: string): string {
  const schedule = getOfficeHoursForDay(ukWeekdayFromDate(date))
  const closeMins = schedule?.close ?? toMinutes(19, 0)
  return ukDateTimeToIso(date, Math.floor(closeMins / 60), closeMins % 60)
}

export function getOfficeHoursPhase(now = new Date()): OfficeHoursPhase {
  const { weekday, hour, minute } = getUKTimeParts(now)
  const schedule = getOfficeHoursForDay(weekday)
  if (!schedule) return 'after'

  const nowMins = toMinutes(hour, minute)
  if (nowMins < schedule.open) return 'before'
  if (nowMins >= schedule.close) return 'after'
  return 'open'
}

export function getTodayOfficeHoursText(now = new Date()): string {
  const { weekday } = getUKTimeParts(now)
  if (weekday === 0) return 'Sunday 12:30 – 15:30'
  return 'Mon–Sat 10:00 – 19:00'
}

export function getOfficeHoursStatusMessage(phase: OfficeHoursPhase, now = new Date()): string {
  const { weekday } = getUKTimeParts(now)
  const schedule = getOfficeHoursForDay(weekday)
  if (!schedule) return 'Office closed'

  const openTime = formatMinutesAsTime(schedule.open)
  const closeTime = formatMinutesAsTime(schedule.close)

  switch (phase) {
    case 'before':
      return `Opens at ${openTime}`
    case 'open':
      return `Office open until ${closeTime}`
    case 'after':
      return `Closed — hours were ${openTime} – ${closeTime}`
  }
}

export interface OfficeHoursTheme {
  phase: OfficeHoursPhase
  statusMessage: string
  hoursText: string
  bannerBg: string
  bannerText: string
  bannerDot: string
  glowGradient: string
  ringColor: string
  statusPillBg: string
  statusIconColor: string
  statusTextColor: string
}

export function getOfficeHoursTheme(now = new Date()): OfficeHoursTheme {
  const phase = getOfficeHoursPhase(now)
  const statusMessage = getOfficeHoursStatusMessage(phase, now)
  const hoursText = getTodayOfficeHoursText(now)

  switch (phase) {
    case 'before':
      return {
        phase,
        statusMessage,
        hoursText,
        bannerBg: 'bg-sky-500/15',
        bannerText: 'text-sky-700 dark:text-sky-300',
        bannerDot: 'bg-sky-500',
        glowGradient:
          'bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.22),transparent_65%)]',
        ringColor: 'border-sky-500/50',
        statusPillBg: 'rgba(14, 165, 233, 0.15)',
        statusIconColor: 'text-sky-500',
        statusTextColor: 'text-sky-700 dark:text-sky-300',
      }
    case 'open':
      return {
        phase,
        statusMessage,
        hoursText,
        bannerBg: 'bg-emerald-500/15',
        bannerText: 'text-emerald-700 dark:text-emerald-300',
        bannerDot: 'bg-emerald-500',
        glowGradient:
          'bg-[radial-gradient(circle_at_50%_40%,rgba(5,150,105,0.28),transparent_65%)]',
        ringColor: 'border-emerald-500/60',
        statusPillBg: 'rgba(5, 150, 105, 0.15)',
        statusIconColor: 'text-emerald-500',
        statusTextColor: 'text-emerald-700 dark:text-emerald-300',
      }
    case 'after':
      return {
        phase,
        statusMessage,
        hoursText,
        bannerBg: 'bg-amber-500/15',
        bannerText: 'text-amber-800 dark:text-amber-300',
        bannerDot: 'bg-amber-500',
        glowGradient:
          'bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.22),transparent_65%)]',
        ringColor: 'border-amber-500/50',
        statusPillBg: 'rgba(245, 158, 11, 0.15)',
        statusIconColor: 'text-amber-500',
        statusTextColor: 'text-amber-800 dark:text-amber-300',
      }
  }
}
