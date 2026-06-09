import { MapPin, ExternalLink } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  formatCoordinates,
  getMapsUrl,
} from '../../lib/geolocation'
import type { AttendanceLocation, AttendanceRecord } from '../../lib/types'
import { formatUKDateTime } from '../../lib/uk'

function LocationRow({
  label,
  location,
}: {
  label: string
  location: AttendanceLocation
}) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2 text-xs">
      <p className="font-medium text-[var(--text-secondary)]">{label}</p>
      <p className="mt-0.5 font-mono text-[var(--text-primary)]">
        {formatCoordinates(location)}
      </p>
      {location.accuracy !== undefined && (
        <p className="text-[var(--text-muted)]">±{Math.round(location.accuracy)}m accuracy</p>
      )}
      <p className="text-[var(--text-muted)]">
        Captured {formatUKDateTime(location.capturedAt)}
      </p>
      <a
        href={getMapsUrl(location)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-asahi-blue no-underline hover:underline"
      >
        <ExternalLink size={11} />
        View on map
      </a>
    </div>
  )
}

interface AttendanceLocationDisplayProps {
  record: AttendanceRecord
  compact?: boolean
}

export function AttendanceLocationDisplay({
  record,
  compact = false,
}: AttendanceLocationDisplayProps) {
  const { user } = useAuth()

  if (user?.role !== 'super_admin') return null
  if (!record.signInLocation && !record.signOutLocation) return null

  if (compact) {
    const loc = record.signInLocation ?? record.signOutLocation
    if (!loc) return null
    return (
      <a
        href={getMapsUrl(loc)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-xs text-asahi-blue no-underline hover:underline"
      >
        <MapPin size={11} />
        {formatCoordinates(loc)}
      </a>
    )
  }

  return (
    <div className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        <MapPin size={12} className="text-asahi-blue" />
        Location (Super Admin)
      </div>
      <div className="space-y-2">
        {record.signInLocation && (
          <LocationRow label="Sign In Location" location={record.signInLocation} />
        )}
        {record.signOutLocation && (
          <LocationRow label="Sign Out Location" location={record.signOutLocation} />
        )}
      </div>
    </div>
  )
}
