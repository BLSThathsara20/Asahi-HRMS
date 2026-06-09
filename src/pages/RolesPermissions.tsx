import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, CheckCircle2, Settings2, RotateCcw } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PermissionChecklist } from '../components/permissions/PermissionChecklist'
import { AccessLevelEditor } from '../components/users/AccessLevelEditor'
import { useAuth } from '../context/AuthContext'
import { fetchSystemUsers } from '../lib/sanity/auth'
import { getRoleColor, getRoleLabel, SYSTEM_ROLES } from '../lib/auth'
import {
  canEditRolePermissions,
  DEFAULT_ROLE_PERMISSIONS,
  getEditableRoles,
  resolvePermissions,
} from '../lib/permissions'
import type { Permission, SystemUser, UserRole } from '../lib/types'
import { formatUKDate } from '../lib/uk'

type Tab = 'roles' | 'users'

export function RolesPermissions() {
  const {
    user,
    roleConfigs,
    updateRolePermissions,
    can,
    canEditPermissionsFor,
    refreshUser,
  } = useAuth()

  const [tab, setTab] = useState<Tab>('roles')
  const [selectedRole, setSelectedRole] = useState<UserRole>('manager')
  const [rolePerms, setRolePerms] = useState<Permission[]>([])
  const [savingRole, setSavingRole] = useState(false)
  const [roleSuccess, setRoleSuccess] = useState(false)
  const [roleError, setRoleError] = useState<string | null>(null)

  const [users, setUsers] = useState<SystemUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)

  const editableRoles = user ? getEditableRoles(user.role) : []

  useEffect(() => {
    if (editableRoles.length && !editableRoles.includes(selectedRole)) {
      setSelectedRole(editableRoles[0])
    }
  }, [editableRoles, selectedRole])

  useEffect(() => {
    setRolePerms(roleConfigs[selectedRole] ?? DEFAULT_ROLE_PERMISSIONS[selectedRole])
  }, [selectedRole, roleConfigs])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      setUsers(await fetchSystemUsers())
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'users') loadUsers()
  }, [tab])

  const handleSaveRole = async () => {
    if (!user || !canEditRolePermissions(user, selectedRole)) return
    setSavingRole(true)
    setRoleError(null)
    setRoleSuccess(false)
    try {
      await updateRolePermissions(selectedRole, rolePerms)
      setRoleSuccess(true)
      setTimeout(() => setRoleSuccess(false), 3000)
    } catch (e) {
      setRoleError(e instanceof Error ? e.message : 'Failed to save role permissions')
    } finally {
      setSavingRole(false)
    }
  }

  const resetRole = () => {
    setRolePerms(DEFAULT_ROLE_PERMISSIONS[selectedRole])
  }

  const canEditSelectedRole = user ? canEditRolePermissions(user, selectedRole) : false

  return (
    <div>
      <Header
        title="Roles & Permissions"
        subtitle="Control role defaults and per-user access levels"
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
            {t === 'roles' ? 'Role Permissions' : 'User Access'}
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
              {SYSTEM_ROLES.map((r) => {
                const editable = user ? canEditRolePermissions(user, r.value) : false
                const count = roleConfigs[r.value]?.length ?? 0
                return (
                  <button
                    key={r.value}
                    onClick={() => setSelectedRole(r.value)}
                    disabled={!can('roles.view')}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-all cursor-pointer border-0 min-h-[52px] ${
                      selectedRole === r.value
                        ? 'bg-asahi-blue/20 ring-1 ring-asahi-blue/40'
                        : 'bg-white/5 hover:bg-white/10'
                    } ${!editable ? 'opacity-70' : ''}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{r.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{count} permissions</p>
                    </div>
                    <Badge color={r.color}>{editable ? 'Editable' : 'View'}</Badge>
                  </button>
                )
              })}
            </div>
          </GlassCard>

          <GlassCard strong className="p-4 lg:col-span-2">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  {getRoleLabel(selectedRole)} — Default Permissions
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Applied to all users with this role unless custom access is set
                </p>
              </div>
              {canEditSelectedRole && (
                <button
                  onClick={resetRole}
                  className="flex items-center gap-1 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent"
                >
                  <RotateCcw size={12} />
                  Reset to factory defaults
                </button>
              )}
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
          </GlassCard>
        </div>
      )}

      {tab === 'users' && (
        <GlassCard strong className="p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Per-User Access Overrides
          </h2>
          <p className="mb-4 text-xs text-[var(--text-muted)]">
            Custom tick marks override the role defaults for individual users
          </p>

          {usersLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No users found.</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => {
                const perms = resolvePermissions(u, roleConfigs)
                const hasCustom = Boolean(u.permissions && u.permissions.length > 0)
                const canEdit = can('users.manage_permissions') && canEditPermissionsFor(u)

                return (
                  <motion.div
                    key={u._id}
                    layout
                    className="rounded-xl bg-white/10 px-4 py-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text-primary)]">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Joined {formatUKDate(u.createdAt)} · {perms.length} active permissions
                          {hasCustom ? ' · custom override' : ' · role defaults'}
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
