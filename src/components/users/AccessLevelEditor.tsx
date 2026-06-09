import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { PermissionChecklist } from '../permissions/PermissionChecklist'
import { useAuth } from '../../context/AuthContext'
import { getRoleColor, getRoleLabel } from '../../lib/auth'
import type { AuthUser, Permission } from '../../lib/types'

interface AccessLevelEditorProps {
  targetUser: AuthUser
  onClose: () => void
  onSaved: (user: AuthUser) => void
}

export function AccessLevelEditor({ targetUser, onClose, onSaved }: AccessLevelEditorProps) {
  const { updatePermissions, roleConfigs } = useAuth()
  const roleSlug = targetUser.roleSlug ?? targetUser.role?.slug ?? 'manager'
  const roleDefaults = roleConfigs[roleSlug] ?? []

  const [selected, setSelected] = useState<Permission[]>(
    targetUser.permissions?.length
      ? targetUser.permissions
      : roleDefaults,
  )
  const [useCustom, setUseCustom] = useState(
    Boolean(targetUser.permissions && targetUser.permissions.length > 0),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleCustom = () => {
    if (useCustom) {
      setUseCustom(false)
      setSelected(roleDefaults)
    } else {
      setUseCustom(true)
      setSelected(roleDefaults)
    }
  }

  const resetToRoleDefaults = () => {
    setSelected(roleDefaults)
    setUseCustom(false)
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      const perms = useCustom ? selected : []
      await updatePermissions(targetUser._id, perms)
      onSaved({
        ...targetUser,
        permissions: perms.length > 0 ? perms : undefined,
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save permissions')
    } finally {
      setLoading(false)
    }
  }

  const effectivePermissions = useCustom ? selected : roleDefaults

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
                User Access Levels
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {targetUser.firstName} {targetUser.lastName}
              </p>
              <Badge color={getRoleColor(targetUser.role)} className="mt-2">
                {getRoleLabel(targetUser.role)}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent min-h-[44px] min-w-[44px]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-4 flex flex-col gap-2 rounded-xl bg-white/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={toggleCustom}
                className="accent-asahi-blue"
              />
              <span className="text-xs text-[var(--text-secondary)]">
                Use custom permissions (override role defaults)
              </span>
            </label>
            <button
              onClick={resetToRoleDefaults}
              className="flex items-center gap-1 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent"
            >
              <RotateCcw size={12} />
              Use role defaults
            </button>
          </div>

          {!useCustom && (
            <p className="mb-4 text-xs text-[var(--text-muted)]">
              Currently inheriting {roleDefaults.length} permissions from{' '}
              {getRoleLabel(targetUser.role)} role. Enable custom to override.
            </p>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <PermissionChecklist
            selected={effectivePermissions}
            onChange={(perms) => {
              setUseCustom(true)
              setSelected(perms)
            }}
            disabled={!useCustom}
            readOnly={!useCustom}
          />

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={loading}
              className="flex-1"
              icon={<Shield size={16} />}
            >
              Save Access
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
