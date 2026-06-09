import { MapPin, ExternalLink } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePlaceName } from '../../hooks/usePlaceName'
import { getMapsUrl } from '../../lib/geolocation'
import type { AttendanceLocation, AttendanceRecord } from '../../lib/types'
import { formatUKDateTime } from '../../lib/uk'

function LocationName({ location }: { location: AttendanceLocation }) {
  const name = usePlaceName(location)
  if (!name) return null

  return (
    <a
      href={getMapsUrl(location)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-asahi-blue no-underline hover:underline"
    >
      <MapPin size={11} />
      {name}
    </a>
  )
}

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
      <p className="mt-0.5 text-[var(--text-primary)]">
        <LocationName location={location} />
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
  /** When false, location is visible to all viewers (e.g. dashboard). Default: super admin only. */
  adminOnly?: boolean
}

export function AttendanceLocationDisplay({
  record,
  compact = false,
  adminOnly = true,
}: AttendanceLocationDisplayProps) {
  const { user } = useAuth()

  if (adminOnly && user?.roleSlug !== 'super_admin') return null
  if (!record.signInLocation && !record.signOutLocation) return null

  const loc = record.signInLocation ?? record.signOutLocation
  if (!loc) return null

  if (compact) {
    return (
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        <LocationName location={loc} />
      </p>
    )
  }

  return (
    <div className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        <MapPin size={12} className="text-asahi-blue" />
        Location
      </div>
      <div className="space-y-2">
        {record.signInLocation && (
          <LocationRow label="Sign In" location={record.signInLocation} />
        )}
        {record.signOutLocation && (
          <LocationRow label="Sign Out" location={record.signOutLocation} />
        )}
      </div>
    </div>
  )
}
