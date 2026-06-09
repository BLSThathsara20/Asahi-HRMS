import { useCallback, useEffect, useState } from 'react'
import {
  fetchTodayAttendance,
  fetchRecentAttendance,
  getEmployeeActiveAttendance,
  signInEmployee,
  signOutEmployee,
} from '../lib/sanity'
import { syncAttendanceToGoogleSheets } from '../lib/googleSheets'
import type { AttendanceLocation, AttendanceRecord } from '../lib/types'

export function useAttendance() {
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([])
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [today, recent] = await Promise.all([
        fetchTodayAttendance(),
        fetchRecentAttendance(10),
      ])
      setTodayRecords(today)
      setRecentRecords(recent)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const signIn = async (employeeId: string, signInLocation?: AttendanceLocation) => {
    setActionLoading(true)
    setError(null)
    try {
      const record = await signInEmployee(employeeId, signInLocation)
      await load()
      void syncAttendanceToGoogleSheets(record, 'sign_in')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed')
      throw e
    } finally {
      setActionLoading(false)
    }
  }

  const signOut = async (attendanceId: string, signOutLocation?: AttendanceLocation) => {
    setActionLoading(true)
    setError(null)
    try {
      const record = await signOutEmployee(attendanceId, signOutLocation)
      await load()
      void syncAttendanceToGoogleSheets(record, 'sign_out')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign out failed')
      throw e
    } finally {
      setActionLoading(false)
    }
  }

  const getActiveRecord = (employeeId: string) =>
    getEmployeeActiveAttendance(employeeId)

  return {
    todayRecords,
    recentRecords,
    loading,
    actionLoading,
    error,
    signIn,
    signOut,
    getActiveRecord,
    reload: load,
  }
}
