import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { DepartmentManager } from './DepartmentManager'
import type { Department, Employee } from '../../lib/types'

interface DepartmentManagerModalProps {
  departments: Department[]
  employees: Employee[]
  onRefresh: () => void
  onClose: () => void
}

export function DepartmentManagerModal({
  departments,
  employees,
  onRefresh,
  onClose,
}: DepartmentManagerModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl"
          role="dialog"
          aria-labelledby="dept-manager-title"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2
              id="dept-manager-title"
              className="text-lg font-semibold text-[var(--text-primary)]"
            >
              Manage Departments
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <DepartmentManager
            embedded
            departments={departments}
            employees={employees}
            onRefresh={onRefresh}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
