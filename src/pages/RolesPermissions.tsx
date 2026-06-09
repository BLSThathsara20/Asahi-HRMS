import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, CheckCircle2, Settings2, RotateCcw, Plus, Trash2 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PermissionChecklist } from '../components/permissions/PermissionChecklist'
import { AccessLevelEditor } from '../components/users/AccessLevelEditor'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { fetchAuthUsers } from '../lib/sanity/auth'
import { getRoleColor, getRoleLabel } from '../lib/auth'
import {
  canDeleteRole,
  canEditRolePermissions,
  DEFAULT_ROLE_PERMISSIONS,
  resolvePermissions,
} from '../lib/permissions'
import type { AuthUser, Permission, RoleConfig } from '../lib/types'
import { formatUKDate } from '../lib/uk'

type Tab = 'roles' | 'users'

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-asahi-blue/50'

export function RolesPermissions() {
  const {
    user,
    roles,
    roleConfigs,
    updateRolePermissions,
    createRole,
    removeRole,
    can,
    canEditPermissionsFor,
    refreshUser,
  } = useAuth()
  const { success: notifySuccess, error: notifyError } = useNotifications()

  const [tab, setTab] = useState<Tab>('roles')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [rolePerms, setRolePerms] = useState<Permission[]>([])
  const [savingRole, setSavingRole] = useState(false)
  const [roleSuccess, setRoleSuccess] = useState(false)
  const [roleError, setRoleError] = useState<string | null>(null)

  const [newRoleName, setNewRoleName] = useState('')
  const [creatingRole, setCreatingRole] = useState(false)

  const [users, setUsers] = useState<AuthUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null)

  const selectedRole = roles.find((r) => r._id === selectedRoleId) ?? roles[0]

  useEffect(() => {
    if (roles.length && !selectedRoleId) {
      setSelectedRoleId(roles[0]._id)
    }
  }, [roles, selectedRoleId])

  useEffect(() => {
    if (selectedRole) {
      setRolePerms(
        roleConfigs[selectedRole.slug] ??
          DEFAULT_ROLE_PERMISSIONS[selectedRole.slug] ??
          selectedRole.permissions,
      )
    }
  }, [selectedRole, roleConfigs])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      setUsers(await fetchAuthUsers())
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'users') loadUsers()
  }, [tab])

  const handleSaveRole = async () => {
    if (!user || !selectedRole || !canEditRolePermissions(user, selectedRole)) return
    setSavingRole(true)
    setRoleError(null)
    setRoleSuccess(false)
    try {
      await updateRolePermissions(selectedRole._id, rolePerms)
      setRoleSuccess(true)
      notifySuccess('Role saved', `${selectedRole.name} permissions updated`)
      setTimeout(() => setRoleSuccess(false), 3000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save role permissions'
      setRoleError(msg)
      notifyError('Could not save role', msg)
    } finally {
      setSavingRole(false)
    }
  }

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return
    setCreatingRole(true)
    setRoleError(null)
    try {
      const created = await createRole({ name: newRoleName.trim() })
      setNewRoleName('')
      setSelectedRoleId(created._id)
      notifySuccess('Role created', created.name)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create role'
      setRoleError(msg)
      notifyError('Could not create role', msg)
    } finally {
      setCreatingRole(false)
    }
  }

  const handleDeleteRole = async (role: RoleConfig) => {
    if (!confirm(`Delete role "${role.name}"?`)) return
    setRoleError(null)
    try {
      await removeRole(role._id)
      if (selectedRoleId === role._id) setSelectedRoleId('')
      notifySuccess('Role deleted', role.name)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete role'
      setRoleError(msg)
      notifyError('Could not delete role', msg)
    }
  }

  const resetRole = () => {
    if (!selectedRole) return
    setRolePerms(
      DEFAULT_ROLE_PERMISSIONS[selectedRole.slug] ?? selectedRole.permissions ?? [],
    )
  }

  const canEditSelectedRole =
    user && selectedRole ? canEditRolePermissions(user, selectedRole) : false

  return (
    <div>
      <Header
        title="Roles & Permissions"
        subtitle="Create roles and manage access levels"
      />

      <div className="mb-4 flex gap-2 rounded-xl bg-white/10 p-1">
        {(['roles', 'users'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer border-0 min-h-[44px] ${
              tab === t
                ? 'bg-asahi-blue text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-white/10'
            }`}
          >
            {t === 'roles' ? <Shield size={16} /> : <Users size={16} />}
            {t === 'roles' ? 'Roles' : 'User Access'}
          </button>
        ))}
      </div>

      {tab === 'roles' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <GlassCard strong className="p-4 lg:col-span-1">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Roles
            </h2>
            <div className="space-y-2">
              {roles.map((r) => {
                const editable = user ? canEditRolePermissions(user, r) : false
                const count = roleConfigs[r.slug]?.length ?? r.permissions.length
                return (
                  <button
                    key={r._id}
                    onClick={() => setSelectedRoleId(r._id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-all cursor-pointer border-0 min-h-[52px] ${
                      selectedRoleId === r._id
                        ? 'bg-asahi-blue/20 ring-1 ring-asahi-blue/40'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{r.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{count} permissions</p>
                    </div>
                    <Badge color={r.color}>{editable ? 'Edit' : 'View'}</Badge>
                  </button>
                )
              })}
            </div>

            {can('roles.manage') && (
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                <input
                  className={inputClass}
                  placeholder="New role name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
                <Button
                  onClick={handleCreateRole}
                  loading={creatingRole}
                  className="w-full"
                  icon={<Plus size={16} />}
                >
                  Create Role
                </Button>
              </div>
            )}
          </GlassCard>

          <GlassCard strong className="p-4 lg:col-span-2">
            {selectedRole ? (
              <>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                      {selectedRole.name} — Default Permissions
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Applied unless a user has custom access
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canEditSelectedRole && (
                      <button
                        onClick={resetRole}
                        className="flex items-center gap-1 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent"
                      >
                        <RotateCcw size={12} />
                        Reset defaults
                      </button>
                    )}
                    {can('roles.manage') && canDeleteRole(selectedRole) && (
                      <button
                        onClick={() => handleDeleteRole(selectedRole)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:underline cursor-pointer border-0 bg-transparent"
                      >
                        <Trash2 size={12} />
                        Delete role
                      </button>
                    )}
                  </div>
                </div>

                {roleSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2 size={16} />
                    Role permissions saved
                  </motion.div>
                )}

                {roleError && (
                  <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {roleError}
                  </div>
                )}

                <PermissionChecklist
                  selected={rolePerms}
                  onChange={setRolePerms}
                  disabled={!canEditSelectedRole}
                  readOnly={!can('roles.manage')}
                />

                {canEditSelectedRole && (
                  <Button
                    onClick={handleSaveRole}
                    loading={savingRole}
                    className="mt-6 w-full sm:w-auto"
                    icon={<Shield size={16} />}
                  >
                    Save Role Permissions
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Select a role</p>
            )}
          </GlassCard>
        </div>
      )}

      {tab === 'users' && (
        <GlassCard strong className="p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Per-User Access Overrides
          </h2>

          {usersLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No users found.</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => {
                const perms = resolvePermissions(u, roleConfigs)
                const hasCustom = Boolean(u.permissions && u.permissions.length > 0)
                const canEdit = can('users.manage_permissions') && canEditPermissionsFor(u)

                return (
                  <motion.div key={u._id} layout className="rounded-xl bg-white/10 px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {u.createdAt && `Joined ${formatUKDate(u.createdAt)} · `}
                          {perms.length} permissions
                          {hasCustom ? ' · custom' : ' · role defaults'}
                        </p>
                      </div>
                      <Badge color={getRoleColor(u.role)}>{getRoleLabel(u.role)}</Badge>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => setEditingUser(u)}
                        className="mt-2 flex items-center gap-1.5 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent p-0 min-h-[44px]"
                      >
                        <Settings2 size={12} />
                        Edit access levels
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </GlassCard>
      )}

      {editingUser && (
        <AccessLevelEditor
          targetUser={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => {
            setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)))
            if (user?._id === updated._id) refreshUser(updated)
            setEditingUser(null)
          }}
        />
      )}
    </div>
  )
}
