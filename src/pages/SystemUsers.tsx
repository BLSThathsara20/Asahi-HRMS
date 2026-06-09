import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  UserCog,
  CheckCircle2,
  Shield,
  Settings2,
  Phone,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { AccessLevelEditor } from '../components/users/AccessLevelEditor'
import { SystemUserEditor } from '../components/users/SystemUserEditor'
import { PermissionGate } from '../components/auth/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { fetchSystemUsers } from '../lib/sanity/auth'
import { getRoleColor, getRoleLabel, SYSTEM_ROLES } from '../lib/auth'
import { resolvePermissions } from '../lib/permissions'
import { Link } from 'react-router-dom'
import type { SystemUser, UserRole } from '../lib/types'
import { formatUKDate } from '../lib/uk'
import { formatPhoneDisplay } from '../lib/phone'

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-asahi-blue/50 transition-colors'

export function SystemUsers() {
  const {
    user,
    createSystemUser,
    updateSystemUser,
    deleteSystemUser,
    resetUserActivation,
    assignableRoles,
    can,
    canEditPermissionsFor,
    canManageUserTarget,
    refreshUser,
    roleConfigs,
  } = useAuth()
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [editingPermissions, setEditingPermissions] = useState<SystemUser | null>(null)
  const [editingDetails, setEditingDetails] = useState<SystemUser | null>(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: assignableRoles[0] ?? 'manager',
  })

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await fetchSystemUsers()
      setUsers(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    if (!form.phone.trim()) {
      setError('Phone number is required — used for first-login verification')
      setSubmitting(false)
      return
    }

    try {
      await createSystemUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: form.role as UserRole,
      })
      setSuccess(true)
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: assignableRoles[0] ?? 'manager',
      })
      await loadUsers()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (target: SystemUser) => {
    if (
      !confirm(
        `Delete ${target.firstName} ${target.lastName}? They will no longer be able to sign in.`,
      )
    )
      return

    setDeletingId(target._id)
    setError(null)
    try {
      await deleteSystemUser(target._id)
      setUsers((prev) => prev.filter((u) => u._id !== target._id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const roleOptions = SYSTEM_ROLES.filter((r) =>
    assignableRoles.includes(r.value),
  )

  return (
    <div>
      <Header
        title="System Users"
        subtitle="Register users and manage access levels"
      />

      {can('roles.view') && (
        <Link
          to="/roles"
          className="mb-4 flex items-center gap-2 rounded-xl bg-asahi-blue/10 px-4 py-3 text-sm text-asahi-blue no-underline hover:bg-asahi-blue/15"
        >
          <Shield size={16} />
          Open Roles & Permissions module
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PermissionGate permission="users.register">
          <GlassCard strong className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <UserCog size={18} className="text-asahi-blue" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Register New User
              </h2>
            </div>

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 size={16} />
                User registered — they will set their password on first login
              </motion.div>
            )}

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
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
                  placeholder="user@asahigroup.co.uk"
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
                  placeholder="07700 900000"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Used to verify identity on first login — user sets their own password
                </p>
              </div>

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

              <Button
                type="submit"
                loading={submitting}
                className="w-full"
                icon={<Shield size={16} />}
              >
                Register User
              </Button>
            </form>
          </GlassCard>
        </PermissionGate>

        <GlassCard strong className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            All Users
          </h2>

          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => {
                const permCount = resolvePermissions(u, roleConfigs).length
                const hasCustom = Boolean(u.permissions && u.permissions.length > 0)
                const manageable = canManageUserTarget(u)
                return (
                  <motion.div
                    key={u._id}
                    layout
                    className="rounded-xl bg-white/10 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Joined {formatUKDate(u.createdAt)} · {permCount} permissions
                          {hasCustom && ' (custom)'}
                        </p>
                        {u.phone && (
                          <p className="text-xs text-[var(--text-muted)]">
                            <Phone size={10} className="inline mr-1" />
                            {formatPhoneDisplay(u.phone)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge color={getRoleColor(u.role)}>{getRoleLabel(u.role)}</Badge>
                        {u.mustSetPassword && (
                          <Badge color="#d97706">Pending setup</Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3">
                      {can('users.edit') && manageable && (
                        <button
                          onClick={() => setEditingDetails(u)}
                          className="flex items-center gap-1.5 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent p-0 min-h-[44px]"
                        >
                          <Pencil size={12} />
                          Edit user
                        </button>
                      )}
                      {can('users.manage_permissions') && canEditPermissionsFor(u) && (
                        <button
                          onClick={() => setEditingPermissions(u)}
                          className="flex items-center gap-1.5 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent p-0 min-h-[44px]"
                        >
                          <Settings2 size={12} />
                          Edit access levels
                        </button>
                      )}
                      {can('users.delete') && manageable && (
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u._id}
                          className="flex items-center gap-1.5 text-xs text-red-500 hover:underline cursor-pointer border-0 bg-transparent p-0 min-h-[44px] disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          {deletingId === u._id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {editingPermissions && (
        <AccessLevelEditor
          targetUser={editingPermissions}
          onClose={() => setEditingPermissions(null)}
          onSaved={(updated) => {
            setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)))
            if (user?._id === updated._id) refreshUser(updated)
            setEditingPermissions(null)
          }}
        />
      )}

      {editingDetails && user && (
        <SystemUserEditor
          targetUser={editingDetails}
          actorRole={user.role}
          onClose={() => setEditingDetails(null)}
          canReset={can('users.reset_activation') && canManageUserTarget(editingDetails)}
          onResetPassword={async () => {
            const updated = await resetUserActivation(editingDetails._id)
            setUsers((prev) =>
              prev.map((x) => (x._id === updated._id ? updated : x)),
            )
          }}
          onSave={async (input) => {
            const updated = await updateSystemUser(editingDetails._id, input)
            setUsers((prev) =>
              prev.map((x) => (x._id === updated._id ? updated : x)),
            )
            if (user._id === updated._id) refreshUser(updated)
          }}
        />
      )}
    </div>
  )
}
