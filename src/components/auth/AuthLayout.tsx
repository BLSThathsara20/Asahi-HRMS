import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Logo } from '../Logo'
import { SiteFooter } from '../layout/SiteFooter'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="gradient-bg flex min-h-[100dvh] items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] sm:right-6">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Logo className="mx-auto mb-6 h-14" />
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-2 text-sm text-white/70">{subtitle}</p>
        </div>

        <div className="glass-strong rounded-2xl p-6">{children}</div>

        <SiteFooter variant="auth" className="mt-6" />
      </motion.div>
    </div>
  )
}
