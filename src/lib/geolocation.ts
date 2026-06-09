import type { AttendanceLocation } from './types'

export interface CapturedLocation {
  latitude: number
  longitude: number
  accuracy?: number
  capturedAt: string
}

export function toAttendanceLocation(captured: CapturedLocation): AttendanceLocation {
  return {
    latitude: captured.latitude,
    longitude: captured.longitude,
    accuracy: captured.accuracy,
    capturedAt: captured.capturedAt,
  }
}

const placeNameCache = new Map<string, string>()

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`
}

/** Short human-readable place name from coordinates (OpenStreetMap). */
export async function resolvePlaceName(latitude: number, longitude: number): Promise<string> {
  const key = cacheKey(latitude, longitude)
  const cached = placeNameCache.get(key)
  if (cached) return cached

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', String(latitude))
    url.searchParams.set('lon', String(longitude))
    url.searchParams.set('format', 'json')
    url.searchParams.set('zoom', '16')

    const res = await fetch(url.toString(), {
      headers: {
        'Accept-Language': 'en-GB',
        'User-Agent': 'Asahi-HRMS/1.0',
      },
    })
    if (!res.ok) throw new Error('Geocode failed')

    const data = (await res.json()) as {
      address?: {
        road?: string
        suburb?: string
        neighbourhood?: string
        city?: string
        town?: string
        village?: string
        postcode?: string
      }
      display_name?: string
    }

    const addr = data.address
    const parts = [
      addr?.road,
      addr?.suburb ?? addr?.neighbourhood,
      addr?.city ?? addr?.town ?? addr?.village,
    ].filter(Boolean)

    const name =
      parts.length > 0
        ? parts.join(', ')
        : data.display_name?.split(',').slice(0, 2).join(', ').trim() || 'Unknown area'

    placeNameCache.set(key, name)
    return name
  } catch {
    return 'Location recorded'
  }
}

export async function captureAttendanceLocation(): Promise<AttendanceLocation> {
  const captured = await captureCurrentLocation()
  const placeName = await resolvePlaceName(captured.latitude, captured.longitude)
  return { ...toAttendanceLocation(captured), placeName }
}

export async function captureCurrentLocation(): Promise<CapturedLocation> {
  if (!navigator.geolocation) {
    throw new Error('Location is not supported on this device or browser')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString(),
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error(
                'Location permission denied. Allow location access to record attendance.',
              ),
            )
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location unavailable. Try again or move to an open area.'))
            break
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'))
            break
          default:
            reject(new Error('Failed to get your location'))
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  })
}

export function formatCoordinates(location: AttendanceLocation): string {
  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
}

export function getMapsUrl(location: AttendanceLocation): string {
  return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
}
