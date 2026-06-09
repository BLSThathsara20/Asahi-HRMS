import { useMemo, useState } from 'react'
import { X, AlertTriangle, Clock, CheckCircle2, Calculator } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { resolveForgotSignOut } from '../../lib/sanity'
import {
  formatMinutesAsTime,
  getOfficeHoursForDay,
  ukDateTimeToIso,
  ukWeekdayFromDate,
} from '../../lib/officeHours'
import { formatUKDate, formatUKTime } from '../../lib/uk'
import type { AttendanceRecord } from '../../lib/types'

function defaultSignOutTimeValue(record: AttendanceRecord): string {
  const schedule = getOfficeHoursForDay(ukWeekdayFromDate(record.date))
  const closeMins = schedule?.close ?? 19 * 60
  return formatMinutesAsTime(closeMins)
}

interface ForgotSignOutModalProps {
  records: AttendanceRecord[]
  periodLabel: string
  onClose: () => void
  onContinue: () => void
  onRecordsChange: () => void
}

export function ForgotSignOutModal({
  records: initialRecords,
  periodLabel,
  onClose,
  onContinue,
  onRecordsChange,
}: ForgotSignOutModalProps) {
  const [records, setRecords] = useState(initialRecords)
  const [times, setTimes] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialRecords.map((r) => [r._id, defaultSignOutTimeValue(r)])),
  )
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sorted = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.employee.firstName.localeCompare(b.employee.firstName),
      ),
    [records],
  )

  const handleFix = async (record: AttendanceRecord) => {
    const timeValue = times[record._id]
    if (!timeValue) {
      setError('Please enter a sign out time')
      return
    }

    const [hour, minute] = timeValue.split(':').map(Number)
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      setError('Invalid time format')
      return
    }

    setSavingId(record._id)
    setError(null)
    try {
      const signOutIso = ukDateTimeToIso(record.date, hour, minute)
      if (new Date(signOutIso).getTime() <= new Date(record.signInTime).getTime()) {
        throw new Error('Sign out must be after sign in')
      }
      await resolveForgotSignOut(record._id, signOutIso)
      setRecords((prev) => prev.filter((r) => r._id !== record._id))
      onRecordsChange()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save sign out time')
    } finally {
      setSavingId(null)
    }
  }

  const allFixed = records.length === 0

  return (
    <Modal onClose={onClose} maxWidth="2xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Forgot sign out — fix before payroll
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {periodLabel} · {records.length} record{records.length !== 1 ? 's' : ''} need
                  a manual sign out time
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

          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            These people signed in but did not sign out. Add the correct leaving time for each
            day before calculating salary.
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {sorted.map((record) => (
              <div
                key={record._id}
                className="rounded-xl bg-white/10 px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)]">
                      {record.employee.firstName} {record.employee.lastName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {record.employee.employeeId} · {formatUKDate(record.date)}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                      <Clock size={11} />
                      Signed in {formatUKTime(record.signInTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="sr-only">Sign out time for {record.employee.firstName}</label>
                    <input
                      type="time"
                      value={times[record._id] ?? defaultSignOutTimeValue(record)}
                      onChange={(e) =>
                        setTimes((prev) => ({ ...prev, [record._id]: e.target.value }))
                      }
                      className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-asahi-blue/50"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleFix(record)}
                      loading={savingId === record._id}
                      icon={<CheckCircle2 size={14} />}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={onContinue}
              disabled={!allFixed}
              icon={<Calculator size={16} />}
            >
              {allFixed ? 'Calculate payroll' : `Fix ${records.length} more first`}
            </Button>
          </div>
    </Modal>
  )
}
