import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
}

interface NotificationContextValue {
  notifications: Notification[]
  notify: (input: Omit<Notification, 'id'> & { duration?: number }) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  dismiss: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const DEFAULT_DURATION = 4500

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback(
    ({
      type,
      title,
      message,
      duration = DEFAULT_DURATION,
    }: Omit<Notification, 'id'> & { duration?: number }) => {
      const id = crypto.randomUUID()
      setNotifications((prev) => [...prev, { id, type, title, message }])
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss],
  )

  const success = useCallback(
    (title: string, message?: string) => notify({ type: 'success', title, message }),
    [notify],
  )

  const error = useCallback(
    (title: string, message?: string) => notify({ type: 'error', title, message }),
    [notify],
  )

  const warning = useCallback(
    (title: string, message?: string) => notify({ type: 'warning', title, message }),
    [notify],
  )

  const info = useCallback(
    (title: string, message?: string) => notify({ type: 'info', title, message }),
    [notify],
  )

  return (
    <NotificationContext.Provider
      value={{ notifications, notify, success, error, warning, info, dismiss }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
