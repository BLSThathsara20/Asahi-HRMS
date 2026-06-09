import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, LogOut, Search, CheckCircle2, Clock, MapPin } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmployeeAvatar } from '../components/EmployeeAvatar'
import { useEmployees } from '../hooks/useEmployees'
import { useAttendance } from '../hooks/useAttendance'
import { getDepartmentColor, getDepartmentLabel } from '../lib/types'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../context/AuthContext'
import { PermissionGate } from '../components/auth/ProtectedRoute'
import { AttendanceExportPanel } from '../components/attendance/AttendanceExportPanel'
import { GoogleSheetsStatus } from '../components/attendance/GoogleSheetsStatus'
import { AttendanceLocationDisplay } from '../components/attendance/AttendanceLocationDisplay'
import { captureCurrentLocation, toAttendanceLocation } from '../lib/geolocation'
import { formatUKTime } from '../lib/uk'

export function Attendance() {
  const { can } = usePermissions()
  const { user } = useAuth()
  const canManage = can('attendance.manage')
  const { employees, loading: empLoading } = useEmployees()
  const { todayRecords, actionLoading, error, signIn, signOut } = useAttendance()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.employeeId.toLowerCase().includes(q) ||
      getDepartmentLabel(e.department).toLowerCase().includes(q)
    )
  })

  const getStatus = (employeeId: string) =>
    todayRecords.find((r) => r.employee._id === employeeId)

  const selected = employees.find((e) => e._id === selectedId)
  const selectedStatus = selectedId ? getStatus(selectedId) : undefined

  const handleSignIn = async () => {
    if (!selectedId) return
    try {
      const location = toAttendanceLocation(await captureCurrentLocation())
      await signIn(selectedId, location)
      setSuccess(`${selected?.firstName} signed in successfully`)
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      /* error shown via hook */
    }
  }

  const handleSignOut = async () => {
    if (!selectedStatus) return
    try {
      const location = toAttendanceLocation(await captureCurrentLocation())
      await signOut(selectedStatus._id, location)
      setSuccess(`${selected?.firstName} signed out successfully`)
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      /* error shown via hook */
    }
  }

  return (
    <div>
      <Header
        title="Sign In / Out"
        subtitle="Clock in and out — UK time (Europe/London)"
      />

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 size={16} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <GlassCard strong className="order-2 p-4 lg:order-1 lg:col-span-2">
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Search by name, ID or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-asahi-blue/50"
            />
          </div>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto lg:max-h-[480px]">
            {empLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading employees...</p>
            ) : (
              filtered.map((employee) => {
                const status = getStatus(employee._id)
                const isSelected = selectedId === employee._id

                return (
                  <motion.button
                    key={employee._id}
                    onClick={() => setSelectedId(employee._id)}
                    whileTap={{ scale: 0.98 }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left transition-all cursor-pointer border-0 min-h-[56px] ${
                      isSelected
                        ? 'bg-asahi-blue/20 ring-1 ring-asahi-blue/40'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <EmployeeAvatar employee={employee} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {employee.employeeId} · {getDepartmentLabel(employee.department)}
                      </p>
                    </div>
                    {status && (
                      <Badge color={status.status === 'signed_in' ? '#059669' : '#64748b'}>
                        {status.status === 'signed_in' ? 'In' : 'Out'}
                      </Badge>
                    )}
                  </motion.button>
                )
              })
            )}
          </div>
        </GlassCard>

        <GlassCard
          strong
          className="order-1 flex min-h-[280px] flex-col items-center justify-center p-6 sm:p-8 lg:order-2 lg:col-span-3 lg:min-h-[400px]"
        >
          {selected ? (
            <motion.div
              key={selected._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex w-full max-w-sm flex-col items-center text-center"
            >
              <EmployeeAvatar employee={selected} size="lg" />
              <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                {selected.firstName} {selected.lastName}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">{selected.jobTitle}</p>
              <Badge color={getDepartmentColor(selected.department)} className="mt-2">
                {getDepartmentLabel(selected.department)}
              </Badge>

              {selectedStatus && (
                <div className="mt-6 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Clock size={14} />
                  Signed in at {formatUKTime(selectedStatus.signInTime)}
                </div>
              )}

              {selectedStatus && (
                <AttendanceLocationDisplay record={selectedStatus} />
              )}

              {canManage ? (
                <div className="mt-8 flex w-full flex-col gap-3">
                  <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <MapPin size={12} />
                    Location permission required to sign in or out
                  </p>
                  <div className="flex w-full gap-3">
                  {!selectedStatus || selectedStatus.status === 'signed_out' ? (
                    <Button
                      onClick={handleSignIn}
                      loading={actionLoading}
                      size="lg"
                      className="flex-1"
                      icon={<LogIn size={18} />}
                    >
                      Sign In
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSignOut}
                      loading={actionLoading}
                      variant="secondary"
                      size="lg"
                      className="flex-1"
                      icon={<LogOut size={18} />}
                    >
                      Sign Out
                    </Button>
                  )}
                  </div>
                </div>
              ) : (
                <p className="mt-8 text-sm text-[var(--text-muted)]">
                  View only — you do not have permission to sign employees in or out.
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                <LogIn size={32} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-lg font-medium text-[var(--text-primary)]">
                Select an employee
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Choose from the list to sign in or out
              </p>
            </motion.div>
          )}
        </GlassCard>
      </div>

      {(user?.role === 'super_admin' || user?.role === 'admin') && (
        <GoogleSheetsStatus />
      )}

      <PermissionGate permission="attendance.export">
        <AttendanceExportPanel selectedEmployeeId={selectedId} />
      </PermissionGate>
    </div>
  )
}
