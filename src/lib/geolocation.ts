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
