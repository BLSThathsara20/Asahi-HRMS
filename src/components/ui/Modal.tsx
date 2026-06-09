import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import type { ReactNode } from 'react'

type ModalMaxWidth = 'md' | 'lg' | '2xl'

const maxWidthClass: Record<ModalMaxWidth, string> = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  '2xl': 'sm:max-w-2xl',
}

interface ModalProps {
  onClose: () => void
  children: ReactNode
  maxWidth?: ModalMaxWidth
  /** Optional id for aria-labelledby on the dialog panel */
  ariaLabelledBy?: string
}

export function Modal({ onClose, children, maxWidth = 'lg', ariaLabelledBy }: ModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex bg-black/50 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className={clsx(
            'glass-strong flex h-[100dvh] w-full flex-col overflow-y-auto rounded-none p-6',
            'pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]',
            'sm:h-auto sm:max-h-[92vh] sm:rounded-2xl',
            maxWidthClass[maxWidth],
          )}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
