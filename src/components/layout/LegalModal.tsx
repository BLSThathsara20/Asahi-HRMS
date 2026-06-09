import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { LEGAL_DOCUMENTS, type LegalDocumentId } from '../../lib/legalContent'

interface LegalModalProps {
  documentId: LegalDocumentId
  onClose: () => void
}

export function LegalModal({ documentId, onClose }: LegalModalProps) {
  const doc = LEGAL_DOCUMENTS[documentId]

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
          className="glass-strong max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl"
          role="dialog"
          aria-labelledby="legal-modal-title"
        >
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
