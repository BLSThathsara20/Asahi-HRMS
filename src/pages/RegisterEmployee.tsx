import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, CheckCircle2, Hash, PoundSterling } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { createEmployee, generateNextEmployeeId } from '../lib/sanity'
import { useDepartments } from '../hooks/useDepartments'
import { getPayRateLabel } from '../lib/payroll'
import type { EmploymentType, PaymentMethod } from '../lib/types'

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-asahi-blue/50 transition-colors'

export function RegisterEmployee() {
  const { departments, loading: deptLoading } = useDepartments()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [nextEmployeeId, setNextEmployeeId] = useState('AG-001')
  const [registeredId, setRegisteredId] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
    jobTitle: '',
    description: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    employmentType: 'full_time' as EmploymentType,
    paymentMethod: '' as PaymentMethod | '',
    payRate: '',
    hoursPerWeek: '',
    payEffectiveFrom: new Date().toISOString().split('T')[0],
  })

  const hasPaymentMethod = Boolean(form.paymentMethod)

  const loadNextId = async () => {
    try {
      const id = await generateNextEmployeeId()
      setNextEmployeeId(id)
    } catch {
      /* keep current preview */
    }
  }

  useEffect(() => {
    loadNextId()
  }, [])

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.departmentId) {
      setError('Please select a department')
      return
    }

    if (!form.paymentMethod) {
      setError('Please select a payment method')
      return
    }

    const payRate = parseFloat(form.payRate)
    if (isNaN(payRate) || payRate < 0) {
      setError('Please enter a valid pay rate')
      return
    }

    if (form.employmentType === 'part_time' && form.paymentMethod === 'monthly') {
      const hours = parseFloat(form.hoursPerWeek)
      if (isNaN(hours) || hours <= 0) {
        setError('Part-time employees need contracted hours per week')
        return
      }
    }

    setLoading(true)
    setError(null)
    setSuccess(false)
    setRegisteredId(null)

    try {
      const employee = await createEmployee({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        departmentId: form.departmentId,
        jobTitle: form.jobTitle,
        description: form.description || undefined,
        phone: form.phone || undefined,
        startDate: form.startDate,
        employmentType: form.employmentType,
        paymentMethod: form.paymentMethod as PaymentMethod,
        payRate,
        hoursPerWeek:
          form.employmentType === 'part_time' && form.hoursPerWeek
            ? parseFloat(form.hoursPerWeek)
            : undefined,
        payEffectiveFrom: form.payEffectiveFrom || form.startDate,
      })
      setRegisteredId(employee.employeeId)
      setSuccess(true)
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        departmentId: departments[0]?._id ?? '',
        jobTitle: '',
        description: '',
        phone: '',
        startDate: new Date().toISOString().split('T')[0],
        employmentType: 'full_time',
        paymentMethod: '',
        payRate: '',
        hoursPerWeek: '',
        payEffectiveFrom: new Date().toISOString().split('T')[0],
      })
      await loadNextId()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Register Employee"
        subtitle="Add a new team member to Asahi Group"
      />

      <GlassCard strong className="mx-auto max-w-xl p-6">
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 size={16} />
            Employee registered successfully
            {registeredId && ` — ID: ${registeredId}`}
          </motion.div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {departments.length === 0 && !deptLoading && (
          <div className="mb-4 rounded-xl bg-amber-500/15 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            No departments found. Create departments on the Dashboard first.
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 rounded-xl bg-asahi-blue/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
          <Hash size={16} className="text-asahi-blue" />
          Next Employee ID: <span className="font-semibold text-[var(--text-primary)]">{nextEmployeeId}</span>
          <span className="text-xs text-[var(--text-muted)]">(auto-generated)</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="name@asahigroup.co.uk"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              Phone (optional)
            </label>
            <input
              type="tel"
              className={inputClass}
              placeholder="07700 900000"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
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
                disabled={deptLoading || departments.length === 0}
              >
                <option value="">Select department</option>
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
                placeholder="Senior Technician"
                value={form.jobTitle}
                onChange={(e) => update('jobTitle', e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <PoundSterling size={16} className="text-asahi-blue" />
              Pay & Employment (UK)
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    Employment Type
                  </label>
                  <select
                    required
                    className={inputClass}
                    value={form.employmentType}
                    onChange={(e) =>
                      update('employmentType', e.target.value)
                    }
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
                    required
                    className={inputClass}
                    value={form.paymentMethod}
                    onChange={(e) => {
                      update('paymentMethod', e.target.value)
                      if (!e.target.value) update('payRate', '')
                    }}
                  >
                    <option value="">Select payment method</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {hasPaymentMethod && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                      {getPayRateLabel(form.paymentMethod as PaymentMethod)}
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      placeholder={
                        form.paymentMethod === 'hourly'
                          ? 'e.g. 18.50'
                          : form.paymentMethod === 'daily'
                            ? 'e.g. 120.00'
                            : 'e.g. 2500.00'
                      }
                      value={form.payRate}
                      onChange={(e) => update('payRate', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                      Pay Effective From
                    </label>
                    <input
                      required
                      type="date"
                      className={inputClass}
                      value={form.payEffectiveFrom}
                      onChange={(e) => update('payEffectiveFrom', e.target.value)}
                    />
                  </div>

                  {form.employmentType === 'part_time' && form.paymentMethod === 'monthly' && (
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
                        placeholder="e.g. 20"
                        value={form.hoursPerWeek}
                        onChange={(e) => update('hoursPerWeek', e.target.value)}
                      />
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Monthly salary is pro-rated against UK full-time 37.5 hrs/week
                      </p>
                    </div>
                  )}

                  {form.paymentMethod === 'hourly' && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Enter how much this employee is paid per hour worked
                    </p>
                  )}
                  {form.paymentMethod === 'daily' && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Enter how much this employee is paid per completed day
                    </p>
                  )}
                  {form.paymentMethod === 'monthly' && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Enter the monthly salary amount in pounds
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              Description
            </label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              placeholder="Role summary, responsibilities, or notes..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="w-full mt-2"
            icon={<UserPlus size={18} />}
            disabled={departments.length === 0}
          >
            Register Employee
          </Button>
        </form>
      </GlassCard>
    </div>
  )
}
