import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { getNavItems } from '../../lib/navigation'

export function BottomNav() {
  const { can } = useAuth()
  const navItems = getNavItems(can)

  if (navItems.length === 0) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
      <div className="mx-auto max-w-lg px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="glass-strong flex items-stretch justify-around rounded-2xl px-1 py-1.5 shadow-lg">
          {navItems.map(({ to, shortLabel, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute inset-0 rounded-xl bg-asahi-blue/15"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={clsx(
                      'relative z-10 transition-colors',
                      isActive ? 'text-asahi-blue' : 'text-[var(--text-muted)]',
                    )}
                  />
                  <span
                    className={clsx(
                      'relative z-10 max-w-full truncate text-[10px] font-medium',
                      isActive ? 'text-asahi-blue' : 'text-[var(--text-muted)]',
                    )}
                  >
                    {shortLabel}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
