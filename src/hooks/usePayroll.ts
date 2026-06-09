import { useCallback, useEffect, useState } from 'react'
import { generatePayroll, loadPayrollPeriod } from '../lib/sanity/payroll'
import type { PayrollLine } from '../lib/types'
import { useEmployees } from './useEmployees'

export function usePayroll(periodStart: string, periodEnd: string) {
  const { employees } = useEmployees()
  const [lines, setLines] = useState<PayrollLine[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!employees.length) {
      setLines([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setLines(await loadPayrollPeriod(employees, periodStart, periodEnd))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payroll')
    } finally {
      setLoading(false)
    }
  }, [employees, periodStart, periodEnd])

  useEffect(() => {
    reload()
  }, [reload])

  const runPayroll = async () => {
    setGenerating(true)
    setError(null)
    try {
      setLines(await generatePayroll(employees, periodStart, periodEnd))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to calculate payroll')
    } finally {
      setGenerating(false)
    }
  }

  return { lines, loading, generating, error, reload, runPayroll }
}
