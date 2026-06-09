import { useEffect, useState } from 'react'
import { Header } from '../components/layout/Header'
import { GlassCard } from '../components/ui/GlassCard'
import { PersonProfileView } from '../components/employees/PersonProfileView'
import { useAuth } from '../context/AuthContext'
import { fetchEmployeeById } from '../lib/sanity'
import type { Employee } from '../lib/types'

export function MyProfile() {
  const { user } = useAuth()
  const [person, setPerson] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const employee = await fetchEmployeeById(user._id)
        if (!cancelled) {
          if (employee) setPerson(employee)
          else setError('Could not load your profile')
        }
      } catch {
        if (!cancelled) setError('Could not load your profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <div>
      <Header
        title="My Profile"
        subtitle="Your details and attendance history"
      />

      <GlassCard strong className="p-6">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading profile...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : person ? (
          <PersonProfileView person={person} />
        ) : null}
      </GlassCard>
    </div>
  )
}
