import { useState } from 'react'
import clsx from 'clsx'
import { COMPANY_NAME, DEVELOPER_NAME, DEVELOPER_URL } from '../../lib/brand'
import { LEGAL_LINKS, type LegalDocumentId } from '../../lib/legalContent'
import { LegalModal } from './LegalModal'

interface SiteFooterProps {
  className?: string
  variant?: 'app' | 'auth'
}

export function SiteFooter({ className, variant = 'app' }: SiteFooterProps) {
  const [openDoc, setOpenDoc] = useState<LegalDocumentId | null>(null)
  const year = new Date().getFullYear()

  return (
    <>
      <footer
        className={clsx(
          'shrink-0 px-4 py-4 text-center',
          variant === 'auth' ? 'text-white/50' : 'text-[var(--text-muted)]',
          className,
        )}
      >
        <p className="text-xs leading-relaxed">
          © {year} {COMPANY_NAME}. United Kingdom.
        </p>
        <p className="mt-1 text-xs leading-relaxed">
          Developed and designed by{' '}
          <a
            href={DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'font-medium underline-offset-2 hover:underline',
              variant === 'auth' ? 'text-white/70 hover:text-white' : 'text-asahi-blue',
            )}
          >
            {DEVELOPER_NAME}
          </a>
        </p>
        <nav className="mt-2 text-xs" aria-label="Legal">
          {LEGAL_LINKS.map((link, index) => (
            <span key={link.id}>
              {index > 0 && (
                <span className={variant === 'auth' ? 'text-white/30' : 'text-white/20'}>
                  {' · '}
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpenDoc(link.id)}
                className={clsx(
                  'cursor-pointer border-0 bg-transparent p-0 hover:underline',
                  variant === 'auth'
                    ? 'text-white/60 hover:text-white/80'
                    : 'text-[var(--text-secondary)] hover:text-asahi-blue',
                )}
              >
                {link.label}
              </button>
            </span>
          ))}
        </nav>
      </footer>

      {openDoc && <LegalModal documentId={openDoc} onClose={() => setOpenDoc(null)} />}
    </>
  )
}
