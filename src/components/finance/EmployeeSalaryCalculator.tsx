import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Clock,
  PoundSterling,
  User,
  TrendingUp,
} from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { LoadingState } from '../ui/Loading'
import { PersonName } from '../PersonName'
import { EmployeeAvatar } from '../EmployeeAvatar'
import { useEmployees } from '../../hooks/useEmployees'
import { fetchAllAttendanceHistory } from '../../lib/sanity'
import {
  calculateEmployeeEarningsToDate,
  calculateEmployeeGross,
  EMPLOYMENT_TYPE_LABELS,
  formatPaySummary,
  isPayConfigured,
  PAYMENT_METHOD_LABELS,
} from '../../lib/payroll'
import { formatGBP, formatUKDate, getCurrentUKYearMonth, getUKMonthRange } from '../../lib/uk'
import type { AttendanceRecord } from '../../lib/types'

interface EmployeeSalaryCalculatorProps {
  yearMonth?: string
}

export function EmployeeSalaryCalculator({ yearMonth }: EmployeeSalaryCalculatorProps) {
  const { employees, loading: employeesLoading } = useEmployees()
  const [selectedId, setSelectedId] = useState('')
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  const month = yearMonth ?? getCurrentUKYearMonth()
  const { start, end } = getUKMonthRange(month)
  const isCurrentMonth = month === getCurrentUKYearMonth()

  const sortedEmployees = useMemo(
    () =>
      [...employees].sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
      ),
    [employees],
  )

  const selected = sortedEmployees.find((e) => e._id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId && sortedEmployees.length > 0) {
      setSelectedId(sortedEmployees[0]._id)
    }
  }, [selectedId, sortedEmployees])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadingAttendance(true)
      try {
        const records = await fetchAllAttendanceHistory(start, end)
        if (!cancelled) setAttendance(records)
      } catch {
        if (!cancelled) setAttendance([])
      } finally {
        if (!cancelled) setLoadingAttendance(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [start, end])

  const toDate = selected
    ? calculateEmployeeEarningsToDate(selected, attendance, start, end)
    : null

  const fullMonth = selected
    ? calculateEmployeeGross(selected, attendance, start, end)
    : null

  const loading = employeesLoading || loadingAttendance

  return (
    <GlassCard strong className="mb-4 p-4">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Employee salary calculator
      </h2>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Select a person to see days attended and pay earned
        {isCurrentMonth ? ' so far this month' : ` for ${month}`}.
      </p>

      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
        Select person
      </label>
      <div className="relative mb-4">
        <User
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={employeesLoading || sortedEmployees.length === 0}
          className="w-full appearance-none rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-asahi-blue/50"
        >
          {sortedEmployees.length === 0 ? (
            <option value="">No people found</option>
          ) : (
            sortedEmployees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.firstName} {e.lastName} ({e.employeeId})
              </option>
            ))
          )}
        </select>
      </div>

      {loading ? (
        <LoadingState message="Calculating attendance" size="sm" />
      ) : selected && toDate ? (
        <div>
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <EmployeeAvatar employee={selected} size="md" />
            <div className="min-w-0">
              <p className="font-medium text-[var(--text-primary)]">
                <PersonName person={selected} />
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {selected.employeeId} · {selected.jobTitle}
              </p>
              {isPayConfigured(selected) ? (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {selected.employmentType &&
                    EMPLOYMENT_TYPE_LABELS[selected.employmentType]}{' '}
                  ·{' '}
                  {selected.paymentMethod &&
                    PAYMENT_METHOD_LABELS[selected.paymentMethod]}{' '}
                  · {formatGBP(selected.payRate ?? 0)}
                </p>
              ) : (
                <p className="mt-1 text-xs text-amber-500">Pay not configured</p>
              )}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={CalendarDays}
              label={isCurrentMonth ? 'Days came (this month)' : 'Days came'}
              value={String(toDate.daysAttended)}
              accent="text-emerald-500"
            />
            <StatCard
              icon={Clock}
              label="Hours worked"
              value={toDate.configured ? `${toDate.hoursWorked}h` : '—'}
            />
            <StatCard
              icon={PoundSterling}
              label={toDate.isMonthToDate ? 'Earned till now' : 'Gross pay'}
              value={toDate.configured ? formatGBP(toDate.grossPay) : '—'}
              accent="text-asahi-blue"
            />
            {toDate.isMonthToDate && fullMonth?.configured && (
              <StatCard
                icon={TrendingUp}
                label="Full month estimate"
                value={formatGBP(fullMonth.grossPay)}
              />
            )}
          </div>

          {toDate.configured && (
            <div className="rounded-xl bg-white/5 p-3 text-xs text-[var(--text-secondary)]">
              <p>
                <span className="text-[var(--text-muted)]">Period: </span>
                {formatUKDate(start)} – {formatUKDate(toDate.effectiveEnd)}
                {toDate.isMonthToDate && ' (month to date)'}
              </p>
              <p className="mt-1">
                <span className="text-[var(--text-muted)]">Calculation: </span>
                {formatPaySummary({
                  employee: selected,
                  hoursWorked: toDate.hoursWorked,
                  daysWorked: toDate.daysWorked,
                  grossPay: toDate.grossPay,
                  paymentMethod: selected.paymentMethod,
                  payRate: selected.payRate,
                  employmentType: selected.employmentType,
                  configured: true,
                  status: 'pending',
                })}
              </p>
              {toDate.isMonthToDate && selected.paymentMethod === 'monthly' && (
                <p className="mt-1 text-[var(--text-muted)]">
                  Monthly salary is prorated by calendar days elapsed in the month.
                </p>
              )}
            </div>
          )}

          {!toDate.configured && (
            <p className="text-xs text-amber-500">
              Configure pay rate on the People page to calculate salary.
            </p>
          )}
        </div>
      ) : null}
    </GlassCard>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        <Icon size={12} />
        {label}
      </div>
      <p className={`mt-1 text-lg font-semibold ${accent ?? 'text-[var(--text-primary)]'}`}>
        {value}
      </p>
    </div>
  )
}
