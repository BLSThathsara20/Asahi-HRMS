import { X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { LEGAL_DOCUMENTS, type LegalDocumentId } from '../../lib/legalContent'

interface LegalModalProps {
  documentId: LegalDocumentId
  onClose: () => void
}

export function LegalModal({ documentId, onClose }: LegalModalProps) {
  const doc = LEGAL_DOCUMENTS[documentId]

  return (
    <Modal onClose={onClose} maxWidth="lg" ariaLabelledBy="legal-modal-title">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2
            id="legal-modal-title"
            className="text-lg font-semibold text-[var(--text-primary)]"
          >
            {doc.title}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">United Kingdom</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 cursor-pointer border-0 bg-transparent"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {section.heading}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
        Last updated {new Date().getFullYear()}
      </p>
    </Modal>
  )
}
