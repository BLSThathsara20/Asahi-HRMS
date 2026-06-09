import type { AttendanceRecord } from './types'
import { formatUKDateTime, formatUKTime } from './uk'
import { getDepartmentLabel } from './types'

const WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(WEBHOOK_URL?.trim())
}

export function getGoogleSheetsWebhookUrl(): string | undefined {
  return WEBHOOK_URL?.trim() || undefined
}

function buildPayload(record: AttendanceRecord, event: 'sign_in' | 'sign_out') {
  const emp = record.employee
  return {
    event,
    recordId: record._id,
    employeeId: emp.employeeId,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    department: getDepartmentLabel(emp.department),
    jobTitle: emp.jobTitle,
    date: record.date,
    signInTime: record.signInTime,
    signInTimeUK: formatUKTime(record.signInTime),
    signOutTime: record.signOutTime ?? '',
    signOutTimeUK: record.signOutTime ? formatUKTime(record.signOutTime) : '',
    status: record.status,
    signInLatitude: record.signInLocation?.latitude ?? '',
    signInLongitude: record.signInLocation?.longitude ?? '',
    signOutLatitude: record.signOutLocation?.latitude ?? '',
    signOutLongitude: record.signOutLocation?.longitude ?? '',
    syncedAt: formatUKDateTime(new Date().toISOString()),
  }
}

/**
 * Sends attendance to Google Sheets via Apps Script web app URL.
 * Fire-and-forget: Sanity remains the source of truth if this fails.
 */
export async function syncAttendanceToGoogleSheets(
  record: AttendanceRecord,
  event: 'sign_in' | 'sign_out',
): Promise<{ ok: boolean; error?: string }> {
  const url = getGoogleSheetsWebhookUrl()
  if (!url) return { ok: false, error: 'Google Sheets webhook not configured' }

  try {
    // POST + no-cors: GAS runs doPost before the 302 redirect (opaque response is OK)
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(buildPayload(record, event)),
    })

    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to reach Google Sheets',
    }
  }
}
