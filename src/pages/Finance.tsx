import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PoundSterling,
  Calculator,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PermissionGate } from '../components/auth/ProtectedRoute'
import { usePayroll } from '../hooks/usePayroll'
import { useAuth } from '../context/AuthContext'
import { updatePayrollStatus } from '../lib/sanity/payroll'
import {
  EMPLOYMENT_TYPE_LABELS,
  formatPaySummary,
  PAYMENT_METHOD_LABELS,
} from '../lib/payroll'
import {
  formatGBP,
  formatUKDate,
  formatUKMonth,
  getCurrentUKYearMonth,
  getUKMonthRange,
} from '../lib/uk'

export function Finance() {
  const { can } = useAuth()
  const [yearMonth, setYearMonth] = useState(getCurrentUKYearMonth())
  const { start, end } = getUKMonthRange(yearMonth)
  const { lines, loading, generating, error, runPayroll, reload } = usePayroll(start, end)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const stats = useMemo(() => {
    const configured = lines.filter((l) => l.configured)
    const total = configured.reduce((s, l) => s + l.grossPay, 0)
    const paid = configured
      .filter((l) => l.status === 'paid')
      .reduce((s, l) => s + l.grossPay, 0)
    const pending = total - paid
    return {
      total,
      paid,
      pending,
      count: configured.length,
      paidCount: configured.filter((l) => l.status === 'paid').length,
    }
  }, [lines])

  const handleTogglePaid = async (entryId: string, current: 'pending' | 'paid') => {
    if (!can('finance.mark_paid')) return
    setUpdatingId(entryId)
    setActionError(null)
    try {
      const next = current === 'paid' ? 'pending' : 'paid'
      await updatePayrollStatus(entryId, next)
      await reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <Header
        title="Finance & Payroll"
        subtitle="UK salary calculator — hourly, daily & monthly pay from attendance"
      />

      <GlassCard strong className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              Pay Period
            </label>
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-asahi-blue/50"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {formatUKMonth(yearMonth)} · {formatUKDate(start)} – {formatUKDate(end)}
            </p>
          </div>
          <PermissionGate permission="finance.manage">
            <Button
              onClick={runPayroll}
              loading={generating}
              icon={<Calculator size={16} />}
              className="w-full sm:w-auto"
            >
              Calculate Payroll
            </Button>
          </PermissionGate>
        </div>
      </GlassCard>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Payroll', value: formatGBP(stats.total), icon: PoundSterling },
          { label: 'Paid', value: formatGBP(stats.paid), icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Pending', value: formatGBP(stats.pending), icon: Clock, color: 'text-amber-500' },
          {
            label: 'Employees',
            value: `${stats.paidCount}/${stats.count} paid`,
            icon: RefreshCw,
          },
        ].map((card) => (
          <GlassCard key={card.label} className="p-4">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <card.icon size={14} />
              {card.label}
            </div>
            <p className={`mt-1 text-lg font-semibold ${card.color ?? 'text-[var(--text-primary)]'}`}>
              {card.value}
            </p>
          </GlassCard>
        ))}
      </div>

      {(error || actionError) && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          {error ?? actionError}
        </div>
      )}

      <GlassCard strong className="p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Salary Breakdown
        </h2>

        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading payroll...</p>
        ) : lines.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No employees found.</p>
        ) : (
          <div className="space-y-3">
            {lines.map((line) => (
              <motion.div
                key={line.employee._id}
                layout
                className="rounded-xl bg-white/10 px-4 py-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)]">
                      {line.employee.firstName} {line.employee.lastName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {line.employee.employeeId} · {line.employee.jobTitle}
                    </p>
                    {line.configured ? (
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {line.employmentType &&
                          EMPLOYMENT_TYPE_LABELS[line.employmentType]}{' '}
                        ·{' '}
                        {line.paymentMethod &&
                          PAYMENT_METHOD_LABELS[line.paymentMethod]}{' '}
                        · {formatPaySummary(line)}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-amber-500">
                        Pay not configured — update employee registration
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {line.configured ? formatGBP(line.grossPay) : '—'}
                    </p>
                    {line.configured && (
                      <Badge color={line.status === 'paid' ? '#059669' : '#d97706'}>
                        {line.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    )}
                  </div>
                </div>

                {line.configured && line.entryId && can('finance.mark_paid') && (
                  <button
                    onClick={() => handleTogglePaid(line.entryId!, line.status)}
                    disabled={updatingId === line.entryId}
                    className="mt-2 flex items-center gap-1.5 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent p-0 min-h-[44px] disabled:opacity-50"
                  >
                    <CheckCircle2 size={12} />
                    {updatingId === line.entryId
                      ? 'Updating...'
                      : line.status === 'paid'
                        ? 'Mark as pending'
                        : 'Mark as paid'}
                  </button>
                )}

                {line.configured && !line.entryId && can('finance.manage') && (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Run payroll to save this calculation
                  </p>
                )}

                {line.status === 'paid' && line.paidAt && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Paid on {formatUKDate(line.paidAt)}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
