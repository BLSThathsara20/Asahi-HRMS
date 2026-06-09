import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Logo } from '../Logo'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const dim = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-10 w-10' : 'h-7 w-7'
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      className={clsx(
        'inline-block rounded-full border-2 border-asahi-blue/25 border-t-asahi-blue',
        dim,
        className,
      )}
      aria-hidden
    />
  )
}

interface AppLoaderProps {
  message?: string
}

/** Full-screen loader for auth bootstrap and route guards. */
export function AppLoader({ message = 'Loading' }: AppLoaderProps) {
  return (
    <div className="gradient-bg flex min-h-[100dvh] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="glass-strong flex flex-col items-center rounded-2xl px-10 py-8 text-center shadow-xl"
      >
        <motion.div
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Logo className="mb-5 h-12" />
        </motion.div>
        <Spinner size="lg" />
        <p className="mt-5 text-sm font-medium text-[var(--text-primary)]">
          {message}
          <LoadingDots />
        </p>
      </motion.div>
    </div>
  )
}

function LoadingDots() {
  return (
    <span className="inline-flex w-6 justify-start">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        >
          .
        </motion.span>
      ))}
    </span>
  )
}

interface LoadingStateProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'inline' | 'card'
}

/** Section / page content loader. */
export function LoadingState({
  message = 'Loading',
  className,
  size = 'md',
  variant = 'inline',
}: LoadingStateProps) {
  const padding = size === 'sm' ? 'py-6' : size === 'lg' ? 'py-14' : 'py-10'

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-3"
    >
      <Spinner size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'} />
      <p className="text-sm text-[var(--text-muted)]">
        {message}
        <LoadingDots />
      </p>
    </motion.div>
  )

  if (variant === 'card') {
    return (
      <div className={clsx('glass-strong rounded-2xl', padding, className)}>
        {content}
      </div>
    )
  }

  return <div className={clsx(padding, className)}>{content}</div>
}

interface LoadingSkeletonProps {
  rows?: number
  className?: string
}

/** Shimmer rows for list placeholders. */
export function LoadingSkeleton({ rows = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12 }}
          className="h-14 rounded-xl bg-white/10"
        />
      ))}
    </div>
  )
}

/** Inline stat placeholder while numbers load. */
export function LoadingStat() {
  return (
    <motion.span
      animate={{ opacity: [0.35, 0.7, 0.35] }}
      transition={{ duration: 1.2, repeat: Infinity }}
      className="inline-block h-9 w-10 rounded-lg bg-white/15"
      aria-label="Loading"
    />
  )
}
