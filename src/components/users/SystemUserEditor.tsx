import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserCog, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { getRoleColor, getRoleLabel, SYSTEM_ROLES } from '../../lib/auth'
import { getAssignableRoles } from '../../lib/auth'
import type { SystemUser, UserRole } from '../../lib/types'

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-asahi-blue/50'

interface SystemUserEditorProps {
  targetUser: SystemUser
  actorRole: UserRole
  onClose: () => void
  onSave: (input: {
    firstName: string
    lastName: string
    email: string
    phone: string
    role: UserRole
  }) => Promise<void>
  onResetPassword?: () => Promise<void>
  canReset?: boolean
}

export function SystemUserEditor({
  targetUser,
  actorRole,
  onClose,
  onSave,
  onResetPassword,
  canReset,
}: SystemUserEditorProps) {
  const assignable = getAssignableRoles(actorRole)
  const [form, setForm] = useState({
    firstName: targetUser.firstName,
    lastName: targetUser.lastName,
    email: targetUser.email,
    phone: targetUser.phone ?? '',
    role: targetUser.role,
  })
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.phone.trim()) {
      setError('Phone number is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSave({
        ...form,
        role: form.role as UserRole,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!onResetPassword) return
    if (
      !confirm(
        `Reset password for ${targetUser.firstName}? They must verify phone and set a new password on next login.`,
      )
    )
      return
    setResetting(true)
    setError(null)
    try {
      await onResetPassword()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  const roleOptions = SYSTEM_ROLES.filter((r) => assignable.includes(r.value))

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
                Edit User
              </h2>
              <Badge color={getRoleColor(targetUser.role)} className="mt-2">
                {getRoleLabel(targetUser.role)}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
            >
              <X size={18} />
            </button>
          </div>

          {targetUser.mustSetPassword && (
            <div className="mb-4 rounded-xl bg-amber-500/15 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
              Pending first login — user has not set a password yet
            </div>
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
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Phone (UK mobile)
              </label>
              <input
                required
                type="tel"
                className={inputClass}
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>

            {roleOptions.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Role
                </label>
                <select
                  className={inputClass}
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {canReset && onResetPassword && (
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 hover:bg-amber-500/15 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={16} />
                {resetting ? 'Resetting...' : 'Reset password (phone verify + new PW)'}
              </button>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="flex-1"
                icon={<UserCog size={16} />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
