import clsx from 'clsx'
import { PERMISSION_GROUPS } from '../../lib/permissions'
import type { Permission } from '../../lib/types'

interface PermissionChecklistProps {
  selected: Permission[]
  onChange: (permissions: Permission[]) => void
  disabled?: boolean
  readOnly?: boolean
}

export function PermissionChecklist({
  selected,
  onChange,
  disabled = false,
  readOnly = false,
}: PermissionChecklistProps) {
  const toggle = (perm: Permission) => {
    if (disabled || readOnly) return
    onChange(
      selected.includes(perm)
        ? selected.filter((p) => p !== perm)
        : [...selected, perm],
    )
  }

  const toggleGroup = (perms: Permission[]) => {
    if (disabled || readOnly) return
    const allSelected = perms.every((p) => selected.includes(p))
    if (allSelected) {
      onChange(selected.filter((p) => !perms.includes(p)))
    } else {
      onChange([...new Set([...selected, ...perms])])
    }
  }

  return (
    <div className="space-y-4">
      {PERMISSION_GROUPS.map((group) => {
        const groupKeys = group.permissions.map((p) => p.key)
        const allChecked = groupKeys.every((k) => selected.includes(k))
        const someChecked = groupKeys.some((k) => selected.includes(k))

        return (
          <div key={group.label}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {group.label}
              </h3>
              {!readOnly && !disabled && (
                <button
                  type="button"
                  onClick={() => toggleGroup(groupKeys)}
                  className="text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent p-0"
                >
                  {allChecked ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {group.permissions.map((perm) => {
                const checked = selected.includes(perm.key)
                return (
                  <label
                    key={perm.key}
                    className={clsx(
                      'flex items-start gap-3 rounded-xl px-3 py-3 transition-colors min-h-[52px]',
                      checked ? 'bg-asahi-blue/10' : 'bg-white/5',
                      !readOnly && !disabled && 'cursor-pointer hover:bg-white/10',
                      (readOnly || disabled) && 'opacity-80',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled || readOnly}
                      onChange={() => toggle(perm.key)}
                      className="mt-1 h-4 w-4 shrink-0 accent-asahi-blue"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {perm.label}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{perm.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
            {someChecked && !allChecked && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">Partially enabled</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
