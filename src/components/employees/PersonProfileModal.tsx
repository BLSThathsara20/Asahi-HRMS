import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { PersonProfileView } from './PersonProfileView'
import type { Employee } from '../../lib/types'

interface PersonProfileModalProps {
  person: Employee
  onClose: () => void
}

export function PersonProfileModal({ person, onClose }: PersonProfileModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl"
        >
          <div className="mb-4 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
            >
              <X size={18} />
            </button>
          </div>
          <PersonProfileView person={person} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
