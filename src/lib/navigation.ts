import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserPlus,
  UserCog,
  Shield,
  PoundSterling,
  type LucideIcon,
} from 'lucide-react'
import { NAV_ITEMS_CONFIG } from './permissions'
import type { Permission } from './types'

export const NAV_ICONS: Record<string, LucideIcon> = {
  '/': LayoutDashboard,
  '/attendance': CalendarDays,
  '/employees': Users,
  '/register': UserPlus,
  '/users': UserCog,
  '/roles': Shield,
  '/finance': PoundSterling,
}

export const NAV_SHORT_LABELS: Record<string, string> = {
  '/': 'Home',
  '/attendance': 'Attendance',
  '/employees': 'Staff',
  '/register': 'Add',
  '/users': 'Users',
  '/roles': 'Roles',
  '/finance': 'Pay',
}

export interface NavItem {
  to: string
  label: string
  shortLabel: string
  permission: Permission
  icon: LucideIcon
}

export function getNavItems(can: (p: Permission) => boolean): NavItem[] {
  return NAV_ITEMS_CONFIG.filter((item) => can(item.permission)).map((item) => ({
    ...item,
    shortLabel: NAV_SHORT_LABELS[item.to] ?? item.label,
    icon: NAV_ICONS[item.to] ?? LayoutDashboard,
  }))
}

/** True when the user only has access to Sign In / Out (single nav item). */
export function isAttendanceOnlyNav(can: (p: Permission) => boolean): boolean {
  const items = getNavItems(can)
  return items.length === 1 && items[0].to === '/attendance'
}
