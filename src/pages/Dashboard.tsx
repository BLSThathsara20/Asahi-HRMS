import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, LogOut, Settings2, UserX } from 'lucide-react'
import { format } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { Badge } from '../components/ui/Badge'
import { EmployeeAvatar } from '../components/EmployeeAvatar'
import { PersonName } from '../components/PersonName'
import { DepartmentManagerModal } from '../components/dashboard/DepartmentManagerModal'
import { useEmployees } from '../hooks/useEmployees'
import { useAttendance } from '../hooks/useAttendance'
import { useDepartments } from '../hooks/useDepartments'
import { usePermissions } from '../hooks/usePermissions'
import { isSuperAdminEmployee } from '../lib/permissions'
import { getDepartmentLabel } from '../lib/types'
import { LoadingSkeleton, LoadingStat } from '../components/ui/Loading'
import { SearchField } from '../components/ui/SearchField'
import { ListPagination } from '../components/ui/ListPagination'
import { useListPagination, PAGE_SIZE_SM } from '../hooks/useListPagination'
import { matchesAttendanceRecord } from '../lib/listSearch'
import { formatUKTime } from '../lib/uk'
import type { AttendanceRecord } from '../lib/types'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

function dedupeTodayRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  const byEmployee = new Map<string, AttendanceRecord>()
  for (const record of records) {
    const existing = byEmployee.get(record.employee._id)
    if (!existing || record.signInTime > existing.signInTime) {
      byEmployee.set(record.employee._id, record)
    }
  }
  return [...byEmployee.values()]
}

function recordStatusBadge(record: AttendanceRecord): { label: string; color: string } {
  if (record.status === 'signed_in') return { label: 'On Site', color: '#059669' }
  if (record.status === 'signed_out') return { label: 'Left', color: '#64748b' }
  return { label: 'Needs review', color: '#d97706' }
}

export function Dashboard() {
  const { can } = usePermissions()
  const { employees, loading: empLoading, reload: reloadEmployees } = useEmployees()
  const { todayRecords, loading: attLoading } = useAttendance()
  const { departments, reload: reloadDepartments } = useDepartments()
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [attendanceSearch, setAttendanceSearch] = useState('')

  const todayLabel = format(new Date(), 'EEEE, d MMMM yyyy', { locale: enGB })

  const staffEmployees = useMemo(
    () => employees.filter((e) => !isSuperAdminEmployee(e)),
    [employees],
  )

  const staffTodayRecords = useMemo(
    () => todayRecords.filter((r) => !isSuperAdminEmployee(r.employee)),
    [todayRecords],
  )

  const todayAttendance = useMemo(
    () => dedupeTodayRecords(staffTodayRecords),
    [staffTodayRecords],
  )

  const onSite = useMemo(
    () => todayAttendance.filter((r) => r.status === 'signed_in'),
    [todayAttendance],
  )
  const leftToday = useMemo(
    () => todayAttendance.filter((r) => r.status === 'signed_out'),
    [todayAttendance],
  )
  const notInYet = Math.max(staffEmployees.length - todayAttendance.length, 0)

  const sortedTodayRecords = useMemo(
    () => [
      ...[...onSite].sort(
        (a, b) => new Date(b.signInTime).getTime() - new Date(a.signInTime).getTime(),
      ),
      ...[...leftToday].sort((a, b) => {
        const aOut = a.signOutTime ?? a.signInTime
        const bOut = b.signOutTime ?? b.signInTime
        return new Date(bOut).getTime() - new Date(aOut).getTime()
      }),
    ],
    [onSite, leftToday],
  )

  const deptTodayCounts = useMemo(() => {
    const counts = departments.map((dept) => ({
      ...dept,
      onSite: onSite.filter((r) => r.employee.department?._id === dept._id).length,
      left: leftToday.filter((r) => r.employee.department?._id === dept._id).length,
    }))
    return counts.filter((d) => d.onSite > 0 || d.left > 0)
  }, [departments, onSite, leftToday])

  const maxDeptToday = Math.max(...deptTodayCounts.map((d) => d.onSite + d.left), 1)

  const filteredTodayRecords = useMemo(() => {
    const q = attendanceSearch.trim()
    if (!q) return sortedTodayRecords
    return sortedTodayRecords.filter((r) => matchesAttendanceRecord(r, q))
  }, [sortedTodayRecords, attendanceSearch])

  const {
    visibleItems: visibleRecords,
    hasMore: hasMoreAttendance,
    loadMore: loadMoreAttendance,
    showing: showingAttendance,
    totalCount: totalAttendance,
  } = useListPagination(filteredTodayRecords, PAGE_SIZE_SM, [attendanceSearch])

  const handleRefresh = () => {
    reloadEmployees()
    reloadDepartments()
  }

  const showStats = can('dashboard.stats')
  const showAttendance = can('dashboard.attendance')
  const showDeptChart = can('dashboard.departments')
  const showDeptManage = can('departments.manage')

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={todayLabel}
        actions={
          showDeptManage ? (
            <button
              type="button"
              onClick={() => setShowDeptModal(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-asahi-blue transition-colors hover:bg-asahi-blue/15 cursor-pointer border-0"
              aria-label="Manage departments"
              title="Manage departments"
            >
              <Settings2 size={18} />
            </button>
          ) : undefined
        }
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {showStats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <motion.div variants={item}>
              <GlassCard className="p-5" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      On Site Now
                    </p>
                    <p className="mt-1 text-4xl font-light text-emerald-500">
                      {attLoading ? <LoadingStat /> : onSite.length}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
                    <LogIn size={22} className="text-emerald-500" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard className="p-5" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Left Today
                    </p>
                    <p className="mt-1 text-4xl font-light text-[var(--text-muted)]">
                      {attLoading ? <LoadingStat /> : leftToday.length}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/15">
                    <LogOut size={22} className="text-slate-400" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard className="p-5" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Not In Yet
                    </p>
                    <p className="mt-1 text-4xl font-light text-amber-500">
                      {empLoading || attLoading ? <LoadingStat /> : notInYet}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
                    <UserX size={22} className="text-amber-500" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {showAttendance && (
            <motion.div variants={item} className={showDeptChart ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <GlassCard strong className="p-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Today&apos;s Attendance
                  </h2>
                  {!attLoading && todayAttendance.length > 0 && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {onSite.length} on site · {leftToday.length} left
                    </span>
                  )}
                </div>
                {attLoading ? (
                  <LoadingSkeleton rows={4} />
                ) : sortedTodayRecords.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">
                    No one has signed in today yet.
                  </p>
                ) : (
                  <>
                    <SearchField
                      className="mb-4"
                      value={attendanceSearch}
                      onChange={setAttendanceSearch}
                      placeholder="Search today's attendance..."
                    />
                    {filteredTodayRecords.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)]">
                        No attendance records match your search.
                      </p>
                    ) : (
                    <>
                    <div className="space-y-3">
                      {visibleRecords.map((record) => {
                        const status = recordStatusBadge(record)
                        const isOnSite = record.status === 'signed_in'

                        return (
                          <motion.div
                            key={record._id}
                            layout
                            className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <EmployeeAvatar employee={record.employee} />
                              <div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                  <PersonName person={record.employee} />
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                  {getDepartmentLabel(record.employee.department)}
                                  {isOnSite
                                    ? ` · In ${formatUKTime(record.signInTime)}`
                                    : record.signOutTime
                                      ? ` · ${formatUKTime(record.signInTime)} – ${formatUKTime(record.signOutTime)}`
                                      : ` · In ${formatUKTime(record.signInTime)}`}
                                </p>
                              </div>
                            </div>
                            <Badge color={status.color}>
                              <span
                                className="inline-block h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              {status.label}
                            </Badge>
                          </motion.div>
                        )
                      })}
                    </div>

                    <ListPagination
                      showing={showingAttendance}
                      total={totalAttendance}
                      hasMore={hasMoreAttendance}
                      onLoadMore={loadMoreAttendance}
                    />
                    </>
                    )}
                  </>
                )}
              </GlassCard>
            </motion.div>
          )}

          {showDeptChart && (
            <motion.div variants={item}>
              <GlassCard strong className="p-6">
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Today by Department
                </h2>
                <p className="mb-4 text-xs text-[var(--text-muted)]">On site and left today</p>
                {attLoading ? (
                  <LoadingSkeleton rows={3} />
                ) : deptTodayCounts.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No attendance recorded today.</p>
                ) : (
                  <div className="space-y-3">
                    {deptTodayCounts.map((dept) => {
                      const total = dept.onSite + dept.left
                      return (
                        <div key={dept._id}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-[var(--text-secondary)]">{dept.name}</span>
                            <span className="font-medium text-[var(--text-primary)]">
                              {dept.onSite > 0 && (
                                <span className="text-emerald-500">{dept.onSite} on site</span>
                              )}
                              {dept.onSite > 0 && dept.left > 0 && (
                                <span className="text-[var(--text-muted)]"> · </span>
                              )}
                              {dept.left > 0 && (
                                <span className="text-[var(--text-muted)]">{dept.left} left</span>
                              )}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(total / maxDeptToday) * 100}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: dept.color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
        </div>

        {!showStats && !showAttendance && !showDeptChart && (
          <GlassCard strong className="p-8 text-center">
            <p className="text-[var(--text-muted)]">
              Your access level does not include any dashboard features.
              Contact your administrator.
            </p>
          </GlassCard>
        )}
      </motion.div>

      {showDeptModal && (
        <DepartmentManagerModal
          departments={departments}
          employees={employees}
          onRefresh={handleRefresh}
          onClose={() => setShowDeptModal(false)}
        />
      )}
    </div>
  )
}
