import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Hash,
  CalendarDays,
} from 'lucide-react'
import { EmployeeAvatar } from '../EmployeeAvatar'
import { Badge } from '../ui/Badge'
import { AttendanceCalendar } from './AttendanceCalendar'
import { getRoleColor, getRoleLabel } from '../../lib/auth'
import { fetchEmployeeAttendanceHistory } from '../../lib/sanity'
import {
  buildAttendanceDayMap,
  countPresentDays,
  formatMonthTitle,
  shiftYearMonth,
} from '../../lib/attendanceCalendar'
import { getDepartmentColor, getDepartmentLabel } from '../../lib/types'
import {
  formatUKDate,
  formatUKMonth,
  getCurrentUKYearMonth,
  getUKMonthRange,
  getUKToday,
} from '../../lib/uk'
import type { Employee } from '../../lib/types'

interface PersonProfileModalProps {
  person: Employee
  onClose: () => void
}

export function PersonProfileModal({ person, onClose }: PersonProfileModalProps) {
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
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <EmployeeAvatar employee={person} size="lg" />
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {person.firstName} {person.lastName}
                </h2>
                <p className="text-sm text-[var(--text-muted)]">{person.jobTitle}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge color={getDepartmentColor(person.department)}>
                    {getDepartmentLabel(person.department)}
                  </Badge>
                  {person.role && (
                    <Badge color={getRoleColor(person.role)}>{getRoleLabel(person.role)}</Badge>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-2 rounded-xl bg-white/5 p-4 text-sm sm:grid-cols-2">
            <Detail icon={Hash} label="Staff ID" value={person.employeeId} />
            <Detail icon={Mail} label="Email" value={person.email} />
            {person.phone && <Detail icon={Phone} label="Phone" value={person.phone} />}
            <Detail icon={Calendar} label="Started" value={formatUKDate(person.startDate)} />
            <Detail icon={Briefcase} label="Department" value={getDepartmentLabel(person.department)} />
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
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Attendance calendar
                </h3>
              </div>
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
                Loading attendance...
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

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="mt-0.5 shrink-0 text-asahi-blue" />
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="truncate text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  )
}
