import { useState, type FormEvent } from 'react'
import { X, PoundSterling, CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { formatGBP, formatUKDate } from '../../lib/uk'
import type { PayrollLine } from '../../lib/types'

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-asahi-blue/50'

interface MarkPaidModalProps {
  line: PayrollLine
  periodLabel: string
  recordedBy: string
  onClose: () => void
  onConfirm: (input: {
    paidAt: string
    paidAmount: number
    paymentReference?: string
  }) => Promise<void>
}

export function MarkPaidModal({
  line,
  periodLabel,
  recordedBy,
  onClose,
  onConfirm,
}: MarkPaidModalProps) {
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10))
  const [paidAmount, setPaidAmount] = useState(String(line.grossPay))
  const [paymentReference, setPaymentReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const amount = Number(paidAmount)
    if (!paidDate) {
      setError('Please select a payment date')
      return
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Please enter a valid payment amount')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const paidAt = new Date(`${paidDate}T12:00:00`).toISOString()
      await onConfirm({
        paidAt,
        paidAmount: Math.round(amount * 100) / 100,
        paymentReference: paymentReference.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="md">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Record payment
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                {line.employee.firstName} {line.employee.lastName} · {periodLabel}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-4 rounded-xl bg-white/5 p-3 text-sm">
            <p className="text-[var(--text-muted)]">Calculated salary</p>
            <p className="text-xl font-semibold text-[var(--text-primary)]">
              {formatGBP(line.grossPay)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Amount paid (£)
              </label>
              <div className="relative">
                <PoundSterling
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className={`${inputClass} pl-9`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Payment date
              </label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Payment reference (optional)
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. BACS ref, cheque number"
                className={inputClass}
              />
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Recorded by {recordedBy}
            </p>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                icon={<CheckCircle2 size={16} />}
                className="flex-1"
              >
                Mark as paid
              </Button>
            </div>
          </form>
    </Modal>
  )
}

export function PaymentRecordSummary({ line }: { line: PayrollLine }) {
  if (line.status !== 'paid' || !line.paidAt) return null

  const amount = line.paidAmount ?? line.grossPay

  return (
    <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-[var(--text-secondary)]">
      <p>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          Paid {formatGBP(amount)}
        </span>
        {' '}on {formatUKDate(line.paidAt)}
        {line.paidByName && ` · recorded by ${line.paidByName}`}
      </p>
      {line.paymentReference && (
        <p className="mt-0.5 text-[var(--text-muted)]">
          Ref: {line.paymentReference}
        </p>
      )}
    </div>
  )
}
