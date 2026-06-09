import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { formatSanityError } from '../lib/sanity/errors'

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-asahi-blue/50 transition-colors'

export function SetupSuperAdmin() {
  const { setupSuperAdmin } = useAuth()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await setupSuperAdmin({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      })
    } catch (err) {
      setError(formatSanityError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Initial Setup"
      subtitle="Create the first Super Admin account for Asahi Group"
    >
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-purple-500/15 px-4 py-3 text-sm text-purple-700 dark:text-purple-300">
        <Shield size={16} />
        No users found. Set up your Super Admin account to get started.
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

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
            placeholder="admin@asahigroup.co.uk"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
            Password
          </label>
          <div className="relative">
            <input
              required
              type={showPassword ? 'text' : 'password'}
              className={inputClass}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] cursor-pointer border-0 bg-transparent"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
            Confirm Password
          </label>
          <input
            required
            type="password"
            className={inputClass}
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
          />
        </div>

        <Button
          type="submit"
          loading={loading}
          size="lg"
          className="w-full"
          icon={<Shield size={18} />}
        >
          Create Super Admin
        </Button>
      </form>
    </AuthLayout>
  )
}
