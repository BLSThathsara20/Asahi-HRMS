import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  type?: 'button' | 'submit'
  icon?: ReactNode
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  type = 'button',
  icon,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors cursor-pointer border-0 outline-none',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-5 py-2.5 text-sm',
        size === 'lg' && 'min-h-[48px] px-8 py-3.5 text-base',
        variant === 'primary' && 'bg-asahi-blue text-white hover:bg-asahi-navy shadow-lg shadow-blue-500/25',
        variant === 'secondary' && 'glass text-[var(--text-primary)] hover:bg-white/30',
        variant === 'ghost' && 'bg-transparent text-[var(--text-secondary)] hover:bg-white/10',
        variant === 'danger' && 'bg-red-500 text-white hover:bg-red-600',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
        />
      ) : icon}
      {children}
    </motion.button>
  )
}
