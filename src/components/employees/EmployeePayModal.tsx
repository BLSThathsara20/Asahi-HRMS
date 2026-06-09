import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { X, PoundSterling, History } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { PersonName } from '../PersonName'
import { updateEmployeePay } from '../../lib/sanity'
import {
  EMPLOYMENT_TYPE_LABELS,
  formatPayHistoryEntry,
  getPayRateLabel,
  isPayConfigured,
  PAYMENT_METHOD_LABELS,
} from '../../lib/payroll'
import { formatGBP, formatUKDateTime } from '../../lib/uk'
import type { Employee, EmploymentType, PaymentMethod } from '../../lib/types'

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-asahi-blue/50'

interface EmployeePayModalProps {
  employee: Employee
  onClose: () => void
  onSaved: (employee: Employee) => void
}

export function EmployeePayModal({ employee, onClose, onSaved }: EmployeePayModalProps) {
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    employee.employmentType ?? 'full_time',
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(
    employee.paymentMethod ?? '',
  )
  const [payRate, setPayRate] = useState(String(employee.payRate ?? ''))
  const [hoursPerWeek, setHoursPerWeek] = useState(String(employee.hoursPerWeek ?? ''))
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const history = [...(employee.payHistory ?? [])].sort((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom),
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!paymentMethod) {
      setError('Please select a payment method')
      return
    }

    const rate = parseFloat(payRate)
    if (isNaN(rate) || rate < 0) {
      setError('Please enter a valid pay rate')
      return
    }

    if (employmentType === 'part_time' && paymentMethod === 'monthly') {
      const hours = parseFloat(hoursPerWeek)
      if (isNaN(hours) || hours <= 0) {
        setError('Part-time monthly pay requires contracted hours per week')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const updated = await updateEmployeePay(employee._id, {
        employmentType,
        paymentMethod,
        payRate: rate,
        hoursPerWeek:
          employmentType === 'part_time' && hoursPerWeek
            ? parseFloat(hoursPerWeek)
            : undefined,
        effectiveFrom,
        note: note || undefined,
      })
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pay')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="lg">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Update Pay
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                <PersonName person={employee} /> · {employee.employeeId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
            >
              <X size={18} />
            </button>
          </div>

          {isPayConfigured(employee) && (
            <div className="mb-4 rounded-xl bg-asahi-blue/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
              Current: {formatGBP(employee.payRate ?? 0)} ·{' '}
              {employee.paymentMethod && PAYMENT_METHOD_LABELS[employee.paymentMethod]}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Employment Type
                </label>
                <select
                  className={inputClass}
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Payment Method
                </label>
                <select
                  className={inputClass}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | '')}
                >
                  <option value="">Select method</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {paymentMethod && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    {getPayRateLabel(paymentMethod)}
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={payRate}
                    onChange={(e) => setPayRate(e.target.value)}
                  />
                </div>

                {employmentType === 'part_time' && paymentMethod === 'monthly' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                      Contracted Hours / Week
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="60"
                      step="0.5"
                      className={inputClass}
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    Effective From
                  </label>
                  <input
                    required
                    type="date"
                    className={inputClass}
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Date this new pay rate takes effect
                  </p>
                </div>
              </motion.div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Note (optional)
              </label>
              <input
                className={inputClass}
                placeholder="e.g. Annual pay review"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="flex-1"
                icon={<PoundSterling size={16} />}
                disabled={!paymentMethod}
              >
                Save Pay Change
              </Button>
            </div>
          </form>

          {history.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <History size={14} />
                Pay Change History
              </div>
              <div className="space-y-2">
                {history.map((entry, i) => (
                  <div
                    key={`${entry.effectiveFrom}-${entry.changedAt}-${i}`}
                    className="rounded-xl bg-white/5 px-3 py-2.5 text-xs"
                  >
                    <p className="font-medium text-[var(--text-primary)]">
                      {formatPayHistoryEntry(entry)}
                    </p>
                    <p className="text-[var(--text-muted)]">
                      {EMPLOYMENT_TYPE_LABELS[entry.employmentType]} · Changed{' '}
                      {formatUKDateTime(entry.changedAt)}
                    </p>
                    {entry.note && (
                      <p className="mt-1 text-[var(--text-secondary)]">{entry.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
    </Modal>
  )
}
