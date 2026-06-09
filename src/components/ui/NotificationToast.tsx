import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useNotifications, type NotificationType } from '../../context/NotificationContext'

const STYLES: Record<
  NotificationType,
  { bg: string; border: string; icon: typeof CheckCircle2; iconClass: string }
> = {
  success: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    icon: AlertCircle,
    iconClass: 'text-red-600 dark:text-red-400',
  },
  warning: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    bg: 'bg-asahi-blue/15',
    border: 'border-asahi-blue/30',
    icon: Info,
    iconClass: 'text-asahi-blue',
  },
}

export function NotificationToast() {
  const { notifications, dismiss } = useNotifications()

  return (
    <div
      className="pointer-events-none fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[100] flex w-full max-w-sm flex-col gap-2 sm:right-6"
      aria-live="polite"
    >
      <AnimatePresence>
        {notifications.map((n) => {
          const style = STYLES[n.type]
          const Icon = style.icon
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              className={`pointer-events-auto glass-strong rounded-xl border p-4 shadow-lg ${style.bg} ${style.border}`}
            >
              <div className="flex items-start gap-3">
                <Icon size={18} className={`mt-0.5 shrink-0 ${style.iconClass}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{n.title}</p>
                  {n.message && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{n.message}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(n.id)}
                  className="shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
