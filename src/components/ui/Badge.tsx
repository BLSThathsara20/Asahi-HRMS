import clsx from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  variant?: 'solid' | 'outline'
  className?: string
}

export function Badge({ children, color = '#1a6fd4', variant = 'solid', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'outline' && 'border',
        className,
      )}
      style={
        variant === 'solid'
          ? { backgroundColor: `${color}22`, color }
          : { borderColor: `${color}55`, color }
      }
    >
      {children}
    </span>
  )
}
