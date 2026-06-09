import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { GlassCard } from './GlassCard'

interface AccordionProps {
  title: string
  description?: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export function Accordion({
  title,
  description,
  defaultOpen = false,
  children,
  className,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <GlassCard strong className={clsx('mb-4 overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left cursor-pointer border-0 bg-transparent"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>
          )}
        </div>
        <ChevronDown
          size={18}
          className={clsx(
            'mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-4 pb-4 pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
