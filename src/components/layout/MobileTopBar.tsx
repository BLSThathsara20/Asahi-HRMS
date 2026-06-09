import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, ChevronDown, User } from 'lucide-react'
import { Logo } from '../Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Badge } from '../ui/Badge'
import { useAuth } from '../../context/AuthContext'
import { getRoleColor, getRoleLabel } from '../../lib/auth'
import { PersonName } from '../PersonName'

export function MobileTopBar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 lg:hidden">
      <div className="glass-strong border-b border-white/10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <Logo className="h-8" />

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 cursor-pointer border-0"
                  aria-label="Account menu"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: getRoleColor(user.role) }}
                  >
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-[var(--text-muted)] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        className="absolute right-0 z-50 mt-2 w-56 rounded-2xl glass-strong p-3 shadow-xl"
                      >
                        <div className="mb-3 flex items-center gap-3 border-b border-white/10 pb-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                            style={{ backgroundColor: getRoleColor(user.role) }}
                          >
                            <User size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                              <PersonName person={user} />
                            </p>
                            <Badge color={getRoleColor(user.role)} className="mt-1">
                              {getRoleLabel(user.role)}
                            </Badge>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setMenuOpen(false)
                            logout()
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 cursor-pointer border-0 bg-transparent"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
