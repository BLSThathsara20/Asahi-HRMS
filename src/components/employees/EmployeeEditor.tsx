import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPen } from 'lucide-react'
import { Button } from '../ui/Button'
import { useDepartments } from '../../hooks/useDepartments'
import { getPayRateLabel } from '../../lib/payroll'
import type { Employee, EmploymentType, PaymentMethod } from '../../lib/types'
import { updateEmployee } from '../../lib/sanity'

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-asahi-blue/50'

interface EmployeeEditorProps {
  employee: Employee
  onClose: () => void
  onSaved: () => void
}

export function EmployeeEditor({ employee, onClose, onSaved }: EmployeeEditorProps) {
  const { departments } = useDepartments()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    departmentId: employee.department?._id ?? '',
    jobTitle: employee.jobTitle,
    description: employee.description ?? '',
    phone: employee.phone ?? '',
    startDate: employee.startDate,
    employmentType: (employee.employmentType ?? 'full_time') as EmploymentType,
    paymentMethod: (employee.paymentMethod ?? 'monthly') as PaymentMethod,
    payRate: String(employee.payRate ?? ''),
    hoursPerWeek: String(employee.hoursPerWeek ?? ''),
  })

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const payRate = parseFloat(form.payRate)
    if (isNaN(payRate) || payRate < 0) {
      setError('Please enter a valid pay rate')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await updateEmployee(employee._id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        departmentId: form.departmentId,
        jobTitle: form.jobTitle,
        description: form.description || undefined,
        phone: form.phone || undefined,
        startDate: form.startDate,
        employmentType: form.employmentType,
        paymentMethod: form.paymentMethod,
        payRate,
        hoursPerWeek:
          form.employmentType === 'part_time' && form.hoursPerWeek
            ? parseFloat(form.hoursPerWeek)
            : undefined,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl"
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Edit Employee
              </h2>
              <p className="text-sm text-[var(--text-muted)]">{employee.employeeId}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  First Name
                </label>
                <input
                  required
                  className={inputClass}
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Last Name
                </label>
                <input
                  required
                  className={inputClass}
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Email
              </label>
              <input
                required
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Department
                </label>
                <select
                  required
                  className={inputClass}
                  value={form.departmentId}
                  onChange={(e) => update('departmentId', e.target.value)}
                >
                  <option value="">Select</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Job Title
                </label>
                <input
                  required
                  className={inputClass}
                  value={form.jobTitle}
                  onChange={(e) => update('jobTitle', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Phone
              </label>
              <input
                type="tel"
                className={inputClass}
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Start Date
              </label>
              <input
                required
                type="date"
                className={inputClass}
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Employment
                </label>
                <select
                  className={inputClass}
                  value={form.employmentType}
                  onChange={(e) => update('employmentType', e.target.value)}
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Pay Method
                </label>
                <select
                  className={inputClass}
                  value={form.paymentMethod}
                  onChange={(e) => update('paymentMethod', e.target.value)}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                {getPayRateLabel(form.paymentMethod)}
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.payRate}
                onChange={(e) => update('payRate', e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Description
              </label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
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
              <Button type="submit" loading={loading} className="flex-1" icon={<UserPen size={16} />}>
                Save
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
