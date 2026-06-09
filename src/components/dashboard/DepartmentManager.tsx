import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { EmployeeAvatar } from '../EmployeeAvatar'
import { PersonName } from '../PersonName'
import { createDepartment, deleteDepartment } from '../../lib/sanity/departments'
import type { Department, Employee } from '../../lib/types'

const PRESET_COLORS = ['#1a6fd4', '#059669', '#d97706', '#7c3aed', '#dc2626', '#64748b']

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-asahi-blue/50'

interface DepartmentManagerProps {
  departments: Department[]
  employees: Employee[]
  onRefresh: () => void
  embedded?: boolean
}

export function DepartmentManager({
  departments,
  employees,
  onRefresh,
  embedded = false,
}: DepartmentManagerProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    try {
      await createDepartment({ name: name.trim(), color })
      setName('')
      showSuccess('Department created')
      onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create department')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department? People must be moved to another department first.')) return
    setDeletingId(id)
    setError(null)
    try {
      await deleteDepartment(id)
      showSuccess('Department deleted')
      onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete department')
    } finally {
      setDeletingId(null)
    }
  }

  const deptEmployeeCount = (deptId: string) =>
    employees.filter((e) => e.department?._id === deptId).length

  const deptEmployees = (deptId: string) =>
    employees.filter((e) => e.department?._id === deptId)

  const content = (
    <>
      {!embedded && (
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-asahi-blue" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Department Management
          </h2>
        </div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 size={16} />
          {success}
        </motion.div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl bg-white/5 p-4">
        <p className="mb-3 text-xs font-medium text-[var(--text-muted)]">Create Department</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <input
              className={inputClass}
              placeholder="e.g. Service, Parts, Sales"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-lg cursor-pointer border-2 transition-transform ${
                  color === c ? 'scale-110 border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <Button onClick={handleCreate} loading={creating} icon={<Plus size={16} />}>
            Add
          </Button>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {departments.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No departments yet. Create one above.
          </p>
        ) : (
          departments.map((dept) => (
            <motion.div
              key={dept._id}
              layout
              className="rounded-xl bg-white/10 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{dept.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {deptEmployeeCount(dept._id)} people
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(dept._id)}
                  disabled={deletingId === dept._id}
                  className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 cursor-pointer border-0 bg-transparent disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {deptEmployees(dept._id).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {deptEmployees(dept._id).map((emp) => (
                    <div
                      key={emp._id}
                      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1"
                    >
                      <EmployeeAvatar employee={emp} size="sm" />
                      <span className="text-xs text-[var(--text-secondary)]">
                        <PersonName person={emp} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </>
  )

  if (embedded) return content

  return <GlassCard strong className="p-6">{content}</GlassCard>
}
