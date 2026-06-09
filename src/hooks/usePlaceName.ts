import { useEffect, useState } from 'react'
import { resolvePlaceName } from '../lib/geolocation'
import type { AttendanceLocation } from '../lib/types'

export function usePlaceName(location: AttendanceLocation | undefined): string | null {
  const [name, setName] = useState<string | null>(location?.placeName ?? null)

  useEffect(() => {
    if (!location) {
      setName(null)
      return
    }
    if (location.placeName) {
      setName(location.placeName)
      return
    }

    let cancelled = false
    resolvePlaceName(location.latitude, location.longitude).then((resolved) => {
      if (!cancelled) setName(resolved)
    })
    return () => {
      cancelled = true
    }
  }, [location])

  return name
}
