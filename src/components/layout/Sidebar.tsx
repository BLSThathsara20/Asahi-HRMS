import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Car } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { getRoleLabel, getRoleColor } from '../../lib/auth'
import { getNavItems } from '../../lib/navigation'
import { Badge } from '../ui/Badge'
import { Logo } from '../Logo'
import { PersonName } from '../PersonName'
import { LogOut } from 'lucide-react'

export function Sidebar() {
  const { user, logout, can } = useAuth()
  const navItems = getNavItems(can)

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-strong hidden w-56 shrink-0 flex-col rounded-2xl p-4 lg:flex"
    >
      <div className="mb-8 flex items-center gap-3 px-2">
        <Logo />
      </div>

      <div className="mb-6 flex items-center gap-2 px-2">
        <Car size={14} className="text-asahi-blue" />
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Car Dealership
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-asahi-blue/15 text-asahi-blue shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-asahi-blue' : ''} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="mt-4 border-t border-white/10 pt-4 px-2">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
            <PersonName person={user} />
          </p>
          <Badge color={getRoleColor(user.role)} className="mt-1.5">
            {getRoleLabel(user.role)}
          </Badge>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-red-400 cursor-pointer border-0 bg-transparent"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}

      <div className="mt-auto border-t border-white/10 pt-4 px-2">
        <p className="text-xs text-[var(--text-muted)]">Asahi Motors London</p>
        <p className="text-xs text-[var(--text-muted)]">United Kingdom</p>
      </div>
    </motion.aside>
  )
}
