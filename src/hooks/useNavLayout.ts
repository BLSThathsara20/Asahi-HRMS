import { useAuth } from '../context/AuthContext'
import { getNavItems, isAttendanceOnlyNav } from '../lib/navigation'

export function useNavLayout() {
  const { can } = useAuth()
  const navItems = getNavItems(can)
  const attendanceOnly = isAttendanceOnlyNav(can)
  return { navItems, attendanceOnly }
}
