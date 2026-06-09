import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { ChevronDown, FileDown, List, Search, SlidersHorizontal } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
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
  { id: 'week', label: '7 days' },
  { id: 'month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'custom', label: 'Custom' },
]

const STATUS_OPTIONS: { value: 'all' | AttendanceStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'signed_in', label: 'On site' },
  { value: 'signed_out', label: 'Left' },
  { value: 'forgot_sign_out', label: 'Forgot sign out' },
]

const PAGE_SIZE = 12

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

function groupByDate(records: AttendanceRecord[]): [string, AttendanceRecord[]][] {
  const map = new Map<string, AttendanceRecord[]>()
  for (const record of records) {
    const list = map.get(record.date) ?? []
    list.push(record)
    map.set(record.date, list)
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

interface AttendanceHistoryPanelProps {
  userId: string
  canManageTeam: boolean
  canExport?: boolean
  userName?: string
}

export function AttendanceHistoryPanel({
  userId,
  canManageTeam,
  canExport = false,
  userName,
}: AttendanceHistoryPanelProps) {
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
  const [showFilters, setShowFilters] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

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
    if (next === 'custom') setShowFilters(true)
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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [startDate, endDate, employeeId, departmentId, statusFilter, search])

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

  const visibleRecords = filtered.slice(0, visibleCount)
  const grouped = useMemo(() => groupByDate(visibleRecords), [visibleRecords])
  const hasMore = filtered.length > visibleCount

  const activeFilterCount = [
    employeeId,
    departmentId,
    statusFilter !== 'all',
    search.trim(),
    preset === 'custom',
  ].filter(Boolean).length

  const handleExportPdf = async () => {
    setExporting(true)
    setExportError(null)
    try {
      const { exportEmployeeAttendancePdf, exportTeamAttendancePdf } =
        await import('../../lib/attendancePdf')

      const exportEmployeeId = canManageTeam ? employeeId : userId
      const isSingleExport = Boolean(exportEmployeeId) || !canManageTeam

      if (isSingleExport) {
        const targetId = exportEmployeeId || userId
        const employee = staffEmployees.find((e) => e._id === targetId)
        if (!employee) {
          setExportError('Select a person to export their PDF')
          return
        }
        const empRecords = filtered.filter((r) => r.employee._id === targetId)
        await exportEmployeeAttendancePdf(
          employee,
          empRecords,
          startDate,
          endDate,
          userName,
        )
      } else {
        await exportTeamAttendancePdf(filtered, startDate, endDate, userName)
      }
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  const exportLabel =
    canManageTeam && !employeeId ? 'Team PDF' : 'Download PDF'

  return (
    <GlassCard strong className="mt-6 overflow-hidden p-0">
      <div className="border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <List size={18} className="text-asahi-blue" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Attendance History
              </h2>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {formatUKDate(startDate)} – {formatUKDate(endDate)}
              {!loading && (
                <span className="text-[var(--text-secondary)]">
                  {' '}
                  · {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>

          {canExport && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportPdf}
              loading={exporting}
              icon={<FileDown size={15} />}
              disabled={loading || filtered.length === 0}
              className="w-full shrink-0 sm:w-auto"
            >
              {exportLabel}
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                preset === p.id
                  ? 'border-asahi-blue/50 bg-asahi-blue/15 text-asahi-blue'
                  : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | AttendanceStatus)}
            className={`${inputClass} sm:w-36`}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
              showFilters || activeFilterCount > 0
                ? 'border-asahi-blue/40 bg-asahi-blue/10 text-asahi-blue'
                : 'border-white/15 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-asahi-blue/20 px-1.5 py-0.5 text-[10px]">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={12}
              className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-white/5 p-3 sm:grid-cols-2 lg:grid-cols-4">
            {preset === 'custom' && (
              <>
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
              </>
            )}

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
        )}
      </div>

      <div className="px-4 py-4 sm:px-6">
        {(error || exportError) && (
          <div className="mb-4 space-y-2">
            {error && (
              <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {exportError && (
              <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {exportError}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">Loading records...</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">
            No attendance records match your filters.
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map(([date, dayRecords]) => (
              <section key={date}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: enGB })}
                </h3>
                <div className="space-y-1.5">
                  {dayRecords.map((record) => {
                    const status = statusBadge(record)
                    const hours = formatHours(record)
                    return (
                      <div
                        key={record._id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2.5 sm:px-4 sm:py-3"
                      >
                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                          {canManageTeam && (
                            <EmployeeAvatar employee={record.employee} size="sm" />
                          )}
                          <div className="min-w-0">
                            {canManageTeam && (
                              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                                {record.employee.firstName} {record.employee.lastName}
                              </p>
                            )}
                            <p className="text-xs text-[var(--text-muted)]">
                              {canManageTeam && (
                                <>
                                  {getDepartmentLabel(record.employee.department)} ·{' '}
                                  {record.employee.employeeId} ·{' '}
                                </>
                              )}
                              {formatUKTime(record.signInTime)}
                              {record.signOutTime && ` – ${formatUKTime(record.signOutTime)}`}
                              {hours && (
                                <span className="text-[var(--text-secondary)]"> · {hours}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Badge color={status.color} className="shrink-0 text-[10px] sm:text-xs">
                          {status.label}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}

            {hasMore && (
              <div className="pt-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                >
                  Show more ({filtered.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
