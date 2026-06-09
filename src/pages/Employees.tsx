import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, PoundSterling, History, Pencil, Trash2, UserRound } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { Badge } from '../components/ui/Badge'
import { EmployeeAvatar } from '../components/EmployeeAvatar'
import { EmployeePayModal } from '../components/employees/EmployeePayModal'
import { EmployeeEditor } from '../components/employees/EmployeeEditor'
import { PersonProfileModal } from '../components/employees/PersonProfileModal'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useEmployees } from '../hooks/useEmployees'
import { useDepartments } from '../hooks/useDepartments'
import { usePermissions } from '../hooks/usePermissions'
import { getDepartmentColor, getDepartmentLabel } from '../lib/types'
import { getRoleColor, getRoleLabel } from '../lib/auth'
import { formatGBP, formatUKDate } from '../lib/uk'
import {
  EMPLOYMENT_TYPE_LABELS,
  isPayConfigured,
  PAYMENT_METHOD_LABELS,
} from '../lib/payroll'
import type { Employee } from '../lib/types'

export function Employees() {
  const { can } = usePermissions()
  const { deletePerson, canDeletePerson, user } = useAuth()
  const { success, error } = useNotifications()
  const { employees, loading, reload } = useEmployees()
  const { departments } = useDepartments()
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [payEmployee, setPayEmployee] = useState<Employee | null>(null)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [viewPerson, setViewPerson] = useState<Employee | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    const matchesSearch =
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.employeeId.toLowerCase().includes(q)
    const matchesDept =
      deptFilter === 'all' || e.department?._id === deptFilter
    return matchesSearch && matchesDept
  })

  return (
    <div>
      <Header
        title="People"
        subtitle={`${employees.length} active at Asahi Motors London`}
      />

      <GlassCard strong className="p-4 mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-asahi-blue/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDeptFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-0 ${
                deptFilter === 'all'
                  ? 'bg-asahi-blue text-white'
                  : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/20'
              }`}
            >
              All
            </button>
            {departments.map((dept) => (
              <button
                key={dept._id}
                onClick={() => setDeptFilter(dept._id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-0 ${
                  deptFilter === dept._id
                    ? 'text-white'
                    : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/20'
                }`}
                style={
                  deptFilter === dept._id
                    ? { backgroundColor: dept.color }
                    : undefined
                }
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading people...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((employee, i) => {
            const history = [...(employee.payHistory ?? [])].sort((a, b) =>
              b.effectiveFrom.localeCompare(a.effectiveFrom),
            )
            const latestChange = history[0]

            return (
              <motion.div
                key={employee._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-5" hover>
                  <div className="flex items-start gap-3">
                    <EmployeeAvatar employee={employee} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text-primary)]">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">{employee.jobTitle}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge color={getDepartmentColor(employee.department)}>
                          {getDepartmentLabel(employee.department)}
                        </Badge>
                        {employee.role && (
                          <Badge color={getRoleColor(employee.role)}>
                            {getRoleLabel(employee.role)}
                          </Badge>
                        )}
                        {employee.mustSetPassword && (
                          <Badge color="#d97706">Pending login</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1 border-t border-white/10 pt-3 text-xs text-[var(--text-muted)]">
                    <p>{employee.employeeId}</p>
                    <p>{employee.email}</p>
                    {employee.phone && <p>{employee.phone}</p>}
                    <p>Started {formatUKDate(employee.startDate)}</p>
                    {isPayConfigured(employee) ? (
                      <>
                        <p className="text-[var(--text-secondary)]">
                          {employee.employmentType &&
                            EMPLOYMENT_TYPE_LABELS[employee.employmentType]}{' '}
                          ·{' '}
                          {employee.paymentMethod &&
                            PAYMENT_METHOD_LABELS[employee.paymentMethod]}{' '}
                          · {formatGBP(employee.payRate ?? 0)}
                        </p>
                        {latestChange && (
                          <p className="flex items-center gap-1 text-[var(--text-muted)]">
                            <History size={11} />
                            Effective from {formatUKDate(latestChange.effectiveFrom)}
                            {history.length > 1 &&
                              ` · ${history.length - 1} previous change${history.length > 2 ? 's' : ''}`}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-amber-500">Pay not configured</p>
                    )}
                    {employee.description && (
                      <p className="mt-2 line-clamp-3 text-[var(--text-secondary)]">
                        {employee.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3">
                      {can('employees.view') && (
                        <button
                          onClick={() => setViewPerson(employee)}
                          className="flex items-center gap-1.5 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent p-0 min-h-[44px]"
                        >
                          <UserRound size={12} />
                          View profile
                        </button>
                      )}
                      {can('employees.edit') && (
                        <button
                          onClick={() => setEditEmployee(employee)}
                          className="flex items-center gap-1.5 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent p-0 min-h-[44px]"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                      )}
                      {can('employees.manage_pay') && (
                        <button
                          onClick={() => setPayEmployee(employee)}
                          className="flex items-center gap-1.5 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent p-0 min-h-[44px]"
                        >
                          <PoundSterling size={12} />
                          {isPayConfigured(employee) ? 'Update pay' : 'Set pay rate'}
                        </button>
                      )}
                      {canDeletePerson(employee) && (
                        <button
                          onClick={async () => {
                            if (
                              !confirm(
                                `Remove ${employee.firstName} ${employee.lastName} from Asahi Motors London?`,
                              )
                            )
                              return
                            setDeletingId(employee._id)
                            try {
                              await deletePerson(employee)
                              success(
                                'Person removed',
                                `${employee.firstName} ${employee.lastName} is no longer active.`,
                              )
                              reload()
                            } catch (e) {
                              error(
                                'Could not remove person',
                                e instanceof Error ? e.message : 'Delete failed',
                              )
                            } finally {
                              setDeletingId(null)
                            }
                          }}
                          disabled={deletingId === employee._id}
                          className="flex items-center gap-1.5 text-xs text-red-500 hover:underline cursor-pointer border-0 bg-transparent p-0 min-h-[44px] disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          {deletingId === employee._id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                      {user?._id === employee._id && can('employees.delete') && (
                        <span className="text-xs text-[var(--text-muted)]">
                          Cannot delete your own account
                        </span>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-sm text-[var(--text-muted)] py-8">
          No people found.
        </p>
      )}

      {payEmployee && (
        <EmployeePayModal
          employee={payEmployee}
          onClose={() => setPayEmployee(null)}
          onSaved={() => {
            reload()
            setPayEmployee(null)
          }}
        />
      )}

      {editEmployee && (
        <EmployeeEditor
          employee={editEmployee}
          onClose={() => setEditEmployee(null)}
          onSaved={reload}
        />
      )}

      {viewPerson && (
        <PersonProfileModal person={viewPerson} onClose={() => setViewPerson(null)} />
      )}
    </div>
  )
}
