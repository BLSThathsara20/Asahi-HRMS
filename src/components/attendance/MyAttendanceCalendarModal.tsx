import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { EmployeeAvatar } from '../EmployeeAvatar'
import { AttendanceCalendar } from '../employees/AttendanceCalendar'
import { fetchEmployeeAttendanceHistory } from '../../lib/sanity'
import {
  buildAttendanceDayMap,
  countPresentDays,
  formatMonthTitle,
  shiftYearMonth,
} from '../../lib/attendanceCalendar'
import {
  formatUKMonth,
  getCurrentUKYearMonth,
  getUKMonthRange,
  getUKToday,
} from '../../lib/uk'
import type { Employee } from '../../lib/types'

interface MyAttendanceCalendarModalProps {
  person: Employee
  onClose: () => void
}

export function MyAttendanceCalendarModal({ person, onClose }: MyAttendanceCalendarModalProps) {
  const [yearMonth, setYearMonth] = useState(getCurrentUKYearMonth())
  const [loading, setLoading] = useState(true)
  const [dayMap, setDayMap] = useState(() => buildAttendanceDayMap([]))

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const { start, end } = getUKMonthRange(yearMonth)
        const records = await fetchEmployeeAttendanceHistory(person._id, start, end)
        if (!cancelled) setDayMap(buildAttendanceDayMap(records))
      } catch {
        if (!cancelled) setDayMap(buildAttendanceDayMap([]))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [person._id, yearMonth])

  const presentDays = countPresentDays(dayMap)
  const today = getUKToday()
  const isCurrentMonth = yearMonth === getCurrentUKYearMonth()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <EmployeeAvatar employee={person} size="md" />
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  My attendance
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {person.firstName} {person.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-500/15 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/25">
              <CalendarDays size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {loading ? '—' : presentDays}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {isCurrentMonth
                  ? `day${presentDays !== 1 ? 's' : ''} came in this month`
                  : `day${presentDays !== 1 ? 's' : ''} came in ${formatUKMonth(yearMonth)}`}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Calendar</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setYearMonth((m) => shiftYearMonth(m, -1))}
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="min-w-[120px] text-center text-sm font-medium text-[var(--text-primary)]">
                  {formatMonthTitle(yearMonth)}
                </span>
                <button
                  onClick={() => setYearMonth((m) => shiftYearMonth(m, 1))}
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                Loading calendar...
              </p>
            ) : (
              <AttendanceCalendar yearMonth={yearMonth} dayMap={dayMap} today={today} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
