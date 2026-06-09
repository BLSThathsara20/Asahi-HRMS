import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, LogOut, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmployeeAvatar } from '../components/EmployeeAvatar'
import { useAttendance } from '../hooks/useAttendance'
import { useAuth } from '../context/AuthContext'
import { getDepartmentColor, getDepartmentLabel } from '../lib/types'
import { usePermissions } from '../hooks/usePermissions'
import { PermissionGate } from '../components/auth/ProtectedRoute'
import { AttendanceExportPanel } from '../components/attendance/AttendanceExportPanel'
import { GoogleSheetsStatus } from '../components/attendance/GoogleSheetsStatus'
import { AttendanceLocationDisplay } from '../components/attendance/AttendanceLocationDisplay'
import { captureCurrentLocation, toAttendanceLocation } from '../lib/geolocation'
import { fetchEmployeeById } from '../lib/sanity'
import { formatUKTime } from '../lib/uk'
import type { Employee } from '../lib/types'

export function Attendance() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const { todayRecords, actionLoading, error, signIn, signOut } = useAttendance()
  const [me, setMe] = useState<Employee | null>(null)
  const [loadingMe, setLoadingMe] = useState(true)
  const [success, setSuccess] = useState<string | null>(null)
  const [justAction, setJustAction] = useState<'in' | 'out' | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchEmployeeById(user._id)
      .then((emp) => {
        if (!cancelled) setMe(emp)
      })
      .finally(() => {
        if (!cancelled) setLoadingMe(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const myStatus = user
    ? todayRecords.find((r) => r.employee._id === user._id)
    : undefined
  const isSignedIn = myStatus?.status === 'signed_in'

  const showSuccess = (message: string, action: 'in' | 'out') => {
    setSuccess(message)
    setJustAction(action)
    setTimeout(() => {
      setSuccess(null)
      setJustAction(null)
    }, 3200)
  }

  const handleSignIn = async () => {
    if (!user) return
    try {
      const location = toAttendanceLocation(await captureCurrentLocation())
      await signIn(user._id, location)
      showSuccess('You are signed in — have a great day!', 'in')
    } catch {
      /* error shown via hook */
    }
  }

  const handleSignOut = async () => {
    if (!myStatus) return
    try {
      const location = toAttendanceLocation(await captureCurrentLocation())
      await signOut(myStatus._id, location)
      showSuccess('You are signed out — see you next time!', 'out')
    } catch {
      /* error shown via hook */
    }
  }

  return (
    <div>
      <Header
        title="Sign In / Out"
        subtitle="Tap below to clock yourself in or out"
      />

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              <CheckCircle2 size={16} />
            </motion.span>
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

      <GlassCard
        strong
        className="relative mx-auto flex min-h-[420px] max-w-md flex-col items-center justify-center overflow-hidden p-8 sm:min-h-[480px]"
      >
        {/* Ambient glow */}
        <motion.div
          animate={{
            opacity: isSignedIn ? 0.35 : 0.12,
            scale: isSignedIn ? 1.15 : 1,
          }}
          transition={{ duration: 0.8 }}
          className={`pointer-events-none absolute inset-0 ${
            isSignedIn
              ? 'bg-[radial-gradient(circle_at_50%_40%,rgba(5,150,105,0.25),transparent_65%)]'
              : 'bg-[radial-gradient(circle_at_50%_40%,rgba(26,111,212,0.2),transparent_65%)]'
          }`}
        />

        {loadingMe ? (
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-sm text-[var(--text-muted)]"
          >
            Loading your profile...
          </motion.p>
        ) : me ? (
          <motion.div
            layout
            className="relative z-10 flex w-full flex-col items-center text-center"
          >
            {/* Avatar with status ring */}
            <div className="relative mb-6">
              {isSignedIn && (
                <motion.span
                  className="absolute inset-0 -m-3 rounded-full border-2 border-emerald-500/60"
                  animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={justAction ?? (isSignedIn ? 'in' : 'out')}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                >
                  <EmployeeAvatar employee={me} size="lg" />
                </motion.div>
              </AnimatePresence>
              <AnimatePresence>
                {justAction && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.4, opacity: 0 }}
                    className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
                  >
                    <Sparkles size={14} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.h2
              layout
              className="text-xl font-semibold text-[var(--text-primary)]"
            >
              {me.firstName} {me.lastName}
            </motion.h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{me.jobTitle}</p>
            <Badge color={getDepartmentColor(me.department)} className="mt-2">
              {getDepartmentLabel(me.department)}
            </Badge>

            <motion.div
              layout
              className="mt-6 flex items-center gap-2 rounded-full px-4 py-2 text-sm"
              animate={{
                backgroundColor: isSignedIn
                  ? 'rgba(5, 150, 105, 0.15)'
                  : 'rgba(100, 116, 139, 0.12)',
              }}
            >
              <motion.span
                animate={{ scale: isSignedIn ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 1.5, repeat: isSignedIn ? Infinity : 0 }}
              >
                <Clock size={14} className={isSignedIn ? 'text-emerald-500' : 'text-[var(--text-muted)]'} />
              </motion.span>
              <span className={isSignedIn ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}>
                {isSignedIn && myStatus
                  ? `On site since ${formatUKTime(myStatus.signInTime)}`
                  : 'Not signed in today'}
              </span>
            </motion.div>

            {myStatus && <AttendanceLocationDisplay record={myStatus} />}

            <motion.div
              layout
              className="mt-8 w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="mb-4 flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
                <MapPin size={12} />
                Location is used when you clock in or out
              </p>

              <AnimatePresence mode="wait">
                {!isSignedIn ? (
                  <motion.div
                    key="sign-in"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  >
                    <Button
                      onClick={handleSignIn}
                      loading={actionLoading}
                      size="lg"
                      className="w-full"
                      icon={<LogIn size={20} />}
                    >
                      Sign In
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="sign-out"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  >
                    <Button
                      onClick={handleSignOut}
                      loading={actionLoading}
                      variant="secondary"
                      size="lg"
                      className="w-full ring-1 ring-emerald-500/30"
                      icon={<LogOut size={20} />}
                    >
                      Sign Out
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Could not load your profile.</p>
        )}
      </GlassCard>

      {can('attendance.manage') && <GoogleSheetsStatus />}

      <PermissionGate permission="attendance.export">
        <AttendanceExportPanel selectedEmployeeId={user?._id ?? null} />
      </PermissionGate>
    </div>
  )
}
