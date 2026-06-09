import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PoundSterling,
  Calculator,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  Banknote,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PermissionGate } from '../components/auth/ProtectedRoute'
import { EmployeeSalaryCalculator } from '../components/finance/EmployeeSalaryCalculator'
import { MarkPaidModal, PaymentRecordSummary } from '../components/finance/MarkPaidModal'
import { ForgotSignOutModal } from '../components/finance/ForgotSignOutModal'
import { fetchForgotSignOutInPeriod } from '../lib/sanity'
import { usePayroll } from '../hooks/usePayroll'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import {
  markPayrollPending,
  recordBulkPayrollPayments,
  recordPayrollPayment,
} from '../lib/sanity/payroll'
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
  getUKToday,
} from '../lib/uk'
import type { AttendanceRecord, PayrollLine } from '../lib/types'

export function Finance() {
  const { can, user } = useAuth()
  const { success, error: notifyError } = useNotifications()
  const [yearMonth, setYearMonth] = useState(getCurrentUKYearMonth())
  const { start, end } = getUKMonthRange(yearMonth)
  const { lines, loading, generating, error, runPayroll, reload } = usePayroll(start, end)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [bulkPaying, setBulkPaying] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [markPaidLine, setMarkPaidLine] = useState<PayrollLine | null>(null)
  const [forgotRecords, setForgotRecords] = useState<AttendanceRecord[]>([])
  const [showForgotModal, setShowForgotModal] = useState(false)

  const loadForgotRecords = useCallback(async () => {
    if (!can('finance.manage')) {
      setForgotRecords([])
      return
    }
    try {
      setForgotRecords(await fetchForgotSignOutInPeriod(start, end))
    } catch {
      setForgotRecords([])
    }
  }, [can, start, end])

  useEffect(() => {
    loadForgotRecords()
  }, [loadForgotRecords])

  const recordedBy = user ? `${user.firstName} ${user.lastName}` : 'Unknown'
  const periodLabel = formatUKMonth(yearMonth)

  const stats = useMemo(() => {
    const configured = lines.filter((l) => l.configured)
    const calculated = configured.filter((l) => l.entryId)
    const total = configured.reduce((s, l) => s + l.grossPay, 0)
    const paid = configured
      .filter((l) => l.status === 'paid')
      .reduce((s, l) => s + (l.paidAmount ?? l.grossPay), 0)
    const pending = total - paid
    const pendingLines = calculated.filter((l) => l.status === 'pending')
    return {
      total,
      paid,
      pending,
      count: configured.length,
      calculatedCount: calculated.length,
      paidCount: configured.filter((l) => l.status === 'paid').length,
      pendingLines,
      pendingTotal: pendingLines.reduce((s, l) => s + l.grossPay, 0),
    }
  }, [lines])

  const handleRecordPayment = async (
    line: PayrollLine,
    input: { paidAt: string; paidAmount: number; paymentReference?: string },
  ) => {
    if (!line.entryId || !can('finance.mark_paid')) return
    setUpdatingId(line.entryId)
    setActionError(null)
    try {
      await recordPayrollPayment(line.entryId, {
        ...input,
        paidByName: recordedBy,
      })
      await reload()
      success(
        'Payment recorded',
        `${line.employee.firstName} ${line.employee.lastName} — ${formatGBP(input.paidAmount)}`,
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to record payment'
      setActionError(message)
      notifyError('Payment failed', message)
      throw e
    } finally {
      setUpdatingId(null)
    }
  }

  const handleMarkPending = async (line: PayrollLine) => {
    if (!line.entryId || !can('finance.mark_paid')) return
    if (!window.confirm('Remove payment record and mark this salary as pending again?')) return

    setUpdatingId(line.entryId)
    setActionError(null)
    try {
      await markPayrollPending(line.entryId)
      await reload()
      success('Marked as pending', `${line.employee.firstName} ${line.employee.lastName}`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update status'
      setActionError(message)
      notifyError('Update failed', message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleMarkAllPaid = async () => {
    if (!can('finance.mark_paid') || stats.pendingLines.length === 0) return

    const confirmed = window.confirm(
      `Record payment for ${stats.pendingLines.length} pending salaries totalling ${formatGBP(stats.pendingTotal)} for ${periodLabel}?`,
    )
    if (!confirmed) return

    setBulkPaying(true)
    setActionError(null)
    const paidAt = new Date(`${getUKToday()}T12:00:00`).toISOString()

    try {
      await recordBulkPayrollPayments(
        stats.pendingLines.map((line) => ({
          entryId: line.entryId!,
          payment: {
            paidAt,
            paidAmount: line.grossPay,
            paidByName: recordedBy,
          },
        })),
      )
      await reload()
      success(
        'All payments recorded',
        `${stats.pendingLines.length} salaries marked as paid for ${periodLabel}`,
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to mark all as paid'
      setActionError(message)
      notifyError('Bulk payment failed', message)
    } finally {
      setBulkPaying(false)
    }
  }

  const hasCalculatedEntries = stats.calculatedCount > 0

  const handleCalculatePayroll = async () => {
    const forgot = await fetchForgotSignOutInPeriod(start, end)
    setForgotRecords(forgot)
    if (forgot.length > 0) {
      setShowForgotModal(true)
      return
    }
    await runPayroll()
  }

  const handleContinueAfterForgot = async () => {
    setShowForgotModal(false)
    await runPayroll()
    await loadForgotRecords()
  }

  return (
    <div>
      <Header
        title="Finance & Payroll"
        subtitle="Calculate salaries from attendance, then record payments when paid"
      />

      {forgotRecords.length > 0 && can('finance.manage') && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-500/15 px-4 py-3">
          <AlertCircle size={18} className="shrink-0 text-amber-500" />
          <div className="flex-1 text-sm text-amber-800 dark:text-amber-300">
            {forgotRecords.length} forgot sign out record
            {forgotRecords.length !== 1 ? 's' : ''} in {periodLabel} — fix before calculating
            payroll
          </div>
          <button
            onClick={() => setShowForgotModal(true)}
            className="shrink-0 text-xs font-medium text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent"
          >
            Review
          </button>
        </div>
      )}

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
              {periodLabel} · {formatUKDate(start)} – {formatUKDate(end)}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <PermissionGate permission="finance.manage">
              <Button
                onClick={handleCalculatePayroll}
                loading={generating}
                icon={<Calculator size={16} />}
                className="w-full sm:w-auto"
              >
                Calculate Payroll
              </Button>
            </PermissionGate>
            <PermissionGate permission="finance.mark_paid">
              {hasCalculatedEntries && stats.pendingLines.length > 0 && (
                <Button
                  onClick={handleMarkAllPaid}
                  loading={bulkPaying}
                  variant="secondary"
                  icon={<Banknote size={16} />}
                  className="w-full sm:w-auto"
                >
                  Mark all paid ({formatGBP(stats.pendingTotal)})
                </Button>
              )}
            </PermissionGate>
          </div>
        </div>

        {!hasCalculatedEntries && !loading && (
          <p className="mt-3 text-xs text-amber-500">
            Run Calculate Payroll first to save amounts — then you can mark each person as paid.
          </p>
        )}
      </GlassCard>

      <EmployeeSalaryCalculator yearMonth={yearMonth} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Payroll', value: formatGBP(stats.total), icon: PoundSterling },
          { label: 'Paid', value: formatGBP(stats.paid), icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Pending', value: formatGBP(stats.pending), icon: Clock, color: 'text-amber-500' },
          {
            label: 'People',
            value: `${stats.paidCount}/${stats.calculatedCount || stats.count} paid`,
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
          <p className="text-sm text-[var(--text-muted)]">No people found.</p>
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
                      <>
                        <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={11} />
                            {line.daysWorked} day{line.daysWorked !== 1 ? 's' : ''} worked
                          </span>
                          {line.paymentMethod === 'hourly' && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} />
                              {line.hoursWorked}h worked
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {line.employmentType &&
                            EMPLOYMENT_TYPE_LABELS[line.employmentType]}{' '}
                          ·{' '}
                          {line.paymentMethod &&
                            PAYMENT_METHOD_LABELS[line.paymentMethod]}{' '}
                          · {formatPaySummary(line)}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-amber-500">
                        Pay not configured — update person details
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {line.configured ? formatGBP(line.grossPay) : '—'}
                    </p>
                    {line.configured && line.entryId && (
                      <Badge color={line.status === 'paid' ? '#059669' : '#d97706'}>
                        {line.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    )}
                    {line.configured && !line.entryId && (
                      <Badge color="#64748b">Not calculated</Badge>
                    )}
                  </div>
                </div>

                <PaymentRecordSummary line={line} />

                {line.configured && line.entryId && can('finance.mark_paid') && (
                  <div className="mt-2 flex flex-wrap gap-3">
                    {line.status === 'pending' ? (
                      <button
                        onClick={() => setMarkPaidLine(line)}
                        disabled={updatingId === line.entryId || bulkPaying}
                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline cursor-pointer border-0 bg-transparent p-0 min-h-[44px] disabled:opacity-50 dark:text-emerald-400"
                      >
                        <Banknote size={12} />
                        {updatingId === line.entryId ? 'Recording...' : `Mark ${formatGBP(line.grossPay)} as paid`}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkPending(line)}
                        disabled={updatingId === line.entryId || bulkPaying}
                        className="flex items-center gap-1.5 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent p-0 min-h-[44px] disabled:opacity-50"
                      >
                        <CheckCircle2 size={12} />
                        {updatingId === line.entryId ? 'Updating...' : 'Mark as pending'}
                      </button>
                    )}
                  </div>
                )}

                {line.configured && !line.entryId && can('finance.manage') && (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Calculate payroll to save this amount, then mark as paid when sent
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {markPaidLine && (
        <MarkPaidModal
          line={markPaidLine}
          periodLabel={periodLabel}
          recordedBy={recordedBy}
          onClose={() => setMarkPaidLine(null)}
          onConfirm={(input) => handleRecordPayment(markPaidLine, input)}
        />
      )}

      {showForgotModal && forgotRecords.length > 0 && (
        <ForgotSignOutModal
          records={forgotRecords}
          periodLabel={periodLabel}
          onClose={() => setShowForgotModal(false)}
          onContinue={handleContinueAfterForgot}
          onRecordsChange={loadForgotRecords}
        />
      )}
    </div>
  )
}
