import { useEffect, useState } from 'react'
import { FileDown, Users, User } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { useEmployees } from '../../hooks/useEmployees'
import { useAuth } from '../../context/AuthContext'
import {
  fetchAllAttendanceHistory,
  fetchEmployeeAttendanceHistory,
} from '../../lib/sanity'
import { getCurrentUKYearMonth, getUKMonthRange } from '../../lib/uk'

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-asahi-blue/50'

type ExportMode = 'employee' | 'team'

interface AttendanceExportPanelProps {
  selectedEmployeeId?: string | null
}

export function AttendanceExportPanel({ selectedEmployeeId }: AttendanceExportPanelProps) {
  const { user } = useAuth()
  const { employees, loading: empLoading } = useEmployees()
  const [mode, setMode] = useState<ExportMode>('employee')
  const [employeeId, setEmployeeId] = useState(selectedEmployeeId ?? '')
  const [yearMonth, setYearMonth] = useState(getCurrentUKYearMonth())
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedEmployeeId) setEmployeeId(selectedEmployeeId)
  }, [selectedEmployeeId])

  const { start, end } = getUKMonthRange(yearMonth)
  const generatedBy = user ? `${user.firstName} ${user.lastName}` : undefined

  const handleExport = async () => {
    setExporting(true)
    setError(null)

    try {
      if (mode === 'employee') {
        if (!employeeId) {
          setError('Please select a person')
          return
        }
        const employee = employees.find((e) => e._id === employeeId)
        if (!employee) {
          setError('Person not found')
          return
        }
        const records = await fetchEmployeeAttendanceHistory(employeeId, start, end)
        const { exportEmployeeAttendancePdf } = await import('../../lib/attendancePdf')
        await exportEmployeeAttendancePdf(employee, records, start, end, generatedBy)
      } else {
        const records = await fetchAllAttendanceHistory(start, end)
        const { exportTeamAttendancePdf } = await import('../../lib/attendancePdf')
        await exportTeamAttendancePdf(records, start, end, generatedBy)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  return (
    <GlassCard strong className="mt-4 p-4">
      <div className="mb-4 flex items-center gap-2">
        <FileDown size={18} className="text-asahi-blue" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Export Attendance History (PDF)
        </h2>
      </div>

      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Download attendance records for HR, payroll, or management review
      </p>

      <div className="mb-4 flex gap-2 rounded-xl bg-white/10 p-1">
        {([
          { key: 'employee' as const, label: 'One Person', icon: User },
          { key: 'team' as const, label: 'Everyone', icon: Users },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer border-0 min-h-[44px] ${
              mode === key
                ? 'bg-asahi-blue text-white'
                : 'text-[var(--text-secondary)] hover:bg-white/10'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mode === 'employee' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              Person
            </label>
            <select
              className={inputClass}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={empLoading}
            >
              <option value="">Select person</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.employeeId} — {e.firstName} {e.lastName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={mode === 'team' ? 'sm:col-span-2 sm:max-w-xs' : ''}>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
            Period
          </label>
          <input
            type="month"
            className={inputClass}
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Button
        onClick={handleExport}
        loading={exporting}
        className="mt-4 w-full sm:w-auto"
        icon={<FileDown size={16} />}
        disabled={mode === 'employee' && !employeeId}
      >
        Download PDF
      </Button>
    </GlassCard>
  )
}
