import { useCallback, useEffect, useState } from 'react'
import { fetchDepartments } from '../lib/sanity/departments'
import type { Department } from '../lib/types'

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchDepartments()
      setDepartments(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { departments, loading, error, reload: load }
}
