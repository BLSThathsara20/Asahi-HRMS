import { X } from 'lucide-react'
import { Modal } from '../ui/Modal'
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
    <Modal onClose={onClose} maxWidth="2xl" ariaLabelledBy="dept-manager-title">
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
    </Modal>
  )
}
