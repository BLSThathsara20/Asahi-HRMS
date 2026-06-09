import { motion, type HTMLMotionProps } from 'framer-motion'
import clsx from 'clsx'
import type { ReactNode } from 'react'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  strong?: boolean
  className?: string
  hover?: boolean
}

export function GlassCard({
  children,
  strong = false,
  className,
  hover = false,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={clsx(
        'rounded-2xl',
        strong ? 'glass-strong' : 'glass',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
