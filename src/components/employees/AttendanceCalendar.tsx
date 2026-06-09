import {
  WEEKDAY_LABELS,
  getMonthCalendarDays,
  type DayAttendanceStatus,
} from '../../lib/attendanceCalendar'

const STATUS_STYLES: Record<DayAttendanceStatus, string> = {
  none: 'bg-white/5 text-[var(--text-muted)]',
  present: 'bg-emerald-500/80 text-white font-semibold shadow-sm',
  signed_in: 'bg-asahi-blue/70 text-white font-semibold ring-2 ring-asahi-blue/40',
  forgot_sign_out: 'bg-amber-500/85 text-white font-semibold ring-2 ring-amber-400/50',
}

interface AttendanceCalendarProps {
  yearMonth: string
  dayMap: Map<string, DayAttendanceStatus>
  today: string
}

export function AttendanceCalendar({ yearMonth, dayMap, today }: AttendanceCalendarProps) {
  const cells = getMonthCalendarDays(yearMonth)

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell.inMonth) {
            return <div key={`pad-${i}`} className="aspect-square" />
          }

          const status = dayMap.get(cell.date) ?? 'none'
          const isToday = cell.date === today

          return (
            <div
              key={cell.date}
              title={
                status === 'present'
                  ? `${cell.day} — Attended`
                  : status === 'signed_in'
                    ? `${cell.day} — Signed in`
                    : status === 'forgot_sign_out'
                      ? `${cell.day} — Forgot sign out`
                      : `${cell.day} — No record`
              }
              className={`relative flex aspect-square items-center justify-center rounded-lg text-xs transition-transform ${STATUS_STYLES[status]} ${
                isToday ? 'ring-2 ring-white/50' : ''
              }`}
            >
              {cell.day}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-500/80" />
          Attended
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-asahi-blue/70" />
          Signed in
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-500/85" />
          Forgot sign out
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-white/10" />
          No record
        </span>
      </div>
    </div>
  )
}
