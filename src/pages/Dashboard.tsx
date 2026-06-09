import { motion } from 'framer-motion'
import { Users, LogIn, LogOut, Building2 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { Badge } from '../components/ui/Badge'
import { EmployeeAvatar } from '../components/EmployeeAvatar'
import { PermissionGate } from '../components/auth/ProtectedRoute'
import { DepartmentManager } from '../components/dashboard/DepartmentManager'
import { useEmployees } from '../hooks/useEmployees'
import { useAttendance } from '../hooks/useAttendance'
import { useDepartments } from '../hooks/useDepartments'
import { usePermissions } from '../hooks/usePermissions'
import { getDepartmentLabel } from '../lib/types'
import { AttendanceLocationDisplay } from '../components/attendance/AttendanceLocationDisplay'
import { formatUKTime } from '../lib/uk'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export function Dashboard() {
  const { can } = usePermissions()
  const { employees, loading: empLoading, reload: reloadEmployees } = useEmployees()
  const { todayRecords, loading: attLoading } = useAttendance()
  const { departments, reload: reloadDepartments } = useDepartments()

  const signedIn = todayRecords.filter((r) => r.status === 'signed_in').length
  const signedOut = todayRecords.filter((r) => r.status === 'signed_out').length

  const deptCounts = departments.map((dept) => ({
    ...dept,
    count: employees.filter((e) => e.department?._id === dept._id).length,
  }))

  const maxDept = Math.max(...deptCounts.map((d) => d.count), 1)

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
        subtitle="Asahi Motors London"
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {showStats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div variants={item}>
              <GlassCard className="p-5" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Total People
                    </p>
                    <p className="mt-1 text-4xl font-light text-[var(--text-primary)]">
                      {empLoading ? '—' : employees.length}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-asahi-blue/15">
                    <Users size={22} className="text-asahi-blue" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard className="p-5" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Signed In
                    </p>
                    <p className="mt-1 text-4xl font-light text-emerald-500">
                      {attLoading ? '—' : signedIn}
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
                      Signed Out
                    </p>
                    <p className="mt-1 text-4xl font-light text-[var(--text-muted)]">
                      {attLoading ? '—' : signedOut}
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
                      Departments
                    </p>
                    <p className="mt-1 text-4xl font-light text-[var(--text-primary)]">
                      {departments.length}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15">
                    <Building2 size={22} className="text-purple-500" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {showAttendance && (
            <motion.div variants={item} className={showDeptChart || showDeptManage ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <GlassCard strong className="p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Today's Attendance
                </h2>
                {attLoading ? (
                  <p className="text-sm text-[var(--text-muted)]">Loading...</p>
                ) : todayRecords.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No attendance records today.</p>
                ) : (
                  <div className="space-y-3">
                    {todayRecords.map((record) => (
                      <motion.div
                        key={record._id}
                        layout
                        className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <EmployeeAvatar employee={record.employee} />
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {record.employee.firstName} {record.employee.lastName}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {getDepartmentLabel(record.employee.department)} · In{' '}
                              {formatUKTime(record.signInTime)}
                              {record.signOutTime && ` · Out ${formatUKTime(record.signOutTime)}`}
                            </p>
                            <AttendanceLocationDisplay record={record} compact />
                          </div>
                        </div>
                        <Badge
                          color={record.status === 'signed_in' ? '#059669' : '#64748b'}
                        >
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                record.status === 'signed_in' ? '#059669' : '#64748b',
                            }}
                          />
                          {record.status === 'signed_in' ? 'On Site' : 'Left'}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {showDeptChart && (
            <motion.div variants={item}>
              <GlassCard strong className="p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  By Department
                </h2>
                {deptCounts.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No departments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {deptCounts.map((dept) => (
                      <div key={dept._id}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-[var(--text-secondary)]">{dept.name}</span>
                          <span className="font-medium text-[var(--text-primary)]">{dept.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(dept.count / maxDept) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: dept.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
        </div>

        <PermissionGate permission="departments.manage">
          <motion.div variants={item}>
            <DepartmentManager
              departments={departments}
              employees={employees}
              onRefresh={handleRefresh}
            />
          </motion.div>
        </PermissionGate>

        {!showStats && !showAttendance && !showDeptChart && !showDeptManage && (
          <GlassCard strong className="p-8 text-center">
            <p className="text-[var(--text-muted)]">
              Your access level does not include any dashboard features.
              Contact your administrator.
            </p>
          </GlassCard>
        )}
      </motion.div>
    </div>
  )
}
