import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { enGB } from 'date-fns/locale'
import type { ReactNode } from 'react'
import { ThemeToggle } from '../ui/ThemeToggle'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const now = new Date()
  const ukDate = format(now, 'EEEE, d MMMM yyyy', { locale: enGB })
  const ukDateShort = format(now, 'd MMM yyyy', { locale: enGB })
  const ukTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 lg:mb-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-muted)] sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {actions}
          <div className="text-right">
            <p className="text-sm font-medium text-[var(--text-primary)]">{ukTime}</p>
            <p className="hidden text-xs text-[var(--text-muted)] md:block">{ukDate}</p>
            <p className="text-xs text-[var(--text-muted)] md:hidden">{ukDateShort}</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:hidden">
          {actions}
          <div className="text-right">
            <p className="text-xs font-medium text-[var(--text-primary)]">{ukTime}</p>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
