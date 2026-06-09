import { useCallback, useEffect, useMemo, useState } from 'react'
import { Filter, List, Search } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { Badge } from '../ui/Badge'
import { EmployeeAvatar } from '../EmployeeAvatar'
import { useEmployees } from '../../hooks/useEmployees'
import { useDepartments } from '../../hooks/useDepartments'
import {
  fetchAllAttendanceHistory,
  fetchEmployeeAttendanceHistory,
} from '../../lib/sanity'
import { isSuperAdminEmployee } from '../../lib/permissions'
import {
  formatUKDate,
  formatUKTime,
  getDateRangePreset,
  type DateRangePreset,
} from '../../lib/uk'
import { getDepartmentLabel } from '../../lib/types'
import type { AttendanceRecord, AttendanceStatus } from '../../lib/types'

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-asahi-blue/50'

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'custom', label: 'Custom' },
]

const STATUS_OPTIONS: { value: 'all' | AttendanceStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'signed_in', label: 'On site' },
  { value: 'signed_out', label: 'Left' },
  { value: 'forgot_sign_out', label: 'Forgot sign out' },
]

function statusBadge(record: AttendanceRecord): { label: string; color: string } {
  if (record.status === 'signed_in') return { label: 'On Site', color: '#059669' }
  if (record.status === 'signed_out') return { label: 'Left', color: '#64748b' }
  return { label: 'Forgot sign out', color: '#d97706' }
}

function formatHours(record: AttendanceRecord): string | null {
  if (!record.signOutTime) return null
  const ms = new Date(record.signOutTime).getTime() - new Date(record.signInTime).getTime()
  if (ms <= 0) return null
  const hours = Math.floor(ms / 3_600_000)
  const mins = Math.round((ms % 3_600_000) / 60_000)
  if (hours === 0) return `${mins}m`
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

interface AttendanceHistoryPanelProps {
  userId: string
  canManageTeam: boolean
}

export function AttendanceHistoryPanel({ userId, canManageTeam }: AttendanceHistoryPanelProps) {
  const { employees } = useEmployees()
  const { departments } = useDepartments()
  const [preset, setPreset] = useState<DateRangePreset>('month')
  const monthRange = getDateRangePreset('month')
  const [startDate, setStartDate] = useState(monthRange.start)
  const [endDate, setEndDate] = useState(monthRange.end)
  const [employeeId, setEmployeeId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all')
  const [search, setSearch] = useState('')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const staffEmployees = useMemo(
    () =>
      employees
        .filter((e) => !isSuperAdminEmployee(e))
        .sort((a, b) => a.firstName.localeCompare(b.firstName)),
    [employees],
  )

  const applyPreset = (next: DateRangePreset) => {
    setPreset(next)
    if (next !== 'custom') {
      const range = getDateRangePreset(next)
      setStartDate(range.start)
      setEndDate(range.end)
    }
  }

  const loadRecords = useCallback(async () => {
    if (!startDate || !endDate || startDate > endDate) return
    setLoading(true)
    setError(null)
    try {
      const data = canManageTeam
        ? await fetchAllAttendanceHistory(startDate, endDate)
        : await fetchEmployeeAttendanceHistory(userId, startDate, endDate)
      setRecords(data.filter((r) => !isSuperAdminEmployee(r.employee)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [canManageTeam, userId, startDate, endDate])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return records
      .filter((r) => {
        if (employeeId && r.employee._id !== employeeId) return false
        if (departmentId && r.employee.department?._id !== departmentId) return false
        if (statusFilter !== 'all' && r.status !== statusFilter) return false
        if (!q) return true
        const name = `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase()
        return (
          name.includes(q) ||
          r.employee.employeeId.toLowerCase().includes(q) ||
          getDepartmentLabel(r.employee.department).toLowerCase().includes(q)
        )
      })
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          a.employee.firstName.localeCompare(b.employee.firstName),
      )
  }, [records, employeeId, departmentId, statusFilter, search])

  return (
    <GlassCard strong className="mt-6 p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <List size={18} className="text-asahi-blue" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Attendance History
        </h2>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                preset === p.id
                  ? 'border-asahi-blue/50 bg-asahi-blue/15 text-asahi-blue'
                  : 'border-white/15 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="search"
              placeholder="Search name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AttendanceStatus)}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {canManageTeam && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                  Person
                </label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">All people</option>
                  {staffEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">All departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <Filter size={12} />
          {formatUKDate(startDate)} – {formatUKDate(endDate)}
          {!loading && ` · ${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">Loading records...</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
          No attendance records match your filters.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((record) => {
            const status = statusBadge(record)
            const hours = formatHours(record)
            return (
              <div
                key={record._id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <EmployeeAvatar employee={record.employee} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {canManageTeam
                        ? `${record.employee.firstName} ${record.employee.lastName}`
                        : formatUKDate(record.date)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {canManageTeam && (
                        <>
                          {formatUKDate(record.date)} ·{' '}
                        </>
                      )}
                      {getDepartmentLabel(record.employee.department)}
                      {canManageTeam && ` · ${record.employee.employeeId}`}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      In {formatUKTime(record.signInTime)}
                      {record.signOutTime && ` · Out ${formatUKTime(record.signOutTime)}`}
                      {hours && ` · ${hours}`}
                    </p>
                  </div>
                </div>
                <Badge color={status.color} className="shrink-0">
                  {status.label}
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
