import { Sheet, CheckCircle2, AlertCircle } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { isGoogleSheetsConfigured } from '../../lib/googleSheets'

export function GoogleSheetsStatus() {
  const connected = isGoogleSheetsConfigured()

  return (
    <GlassCard className="mt-4 p-4">
      <div className="flex items-start gap-3">
        <Sheet size={18} className="mt-0.5 shrink-0 text-asahi-blue" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Google Sheets Sync
          </p>
          {connected ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} />
              Connected — attendance is copied to your sheet on sign in/out
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle size={14} />
              Not configured — add VITE_GOOGLE_SHEETS_WEBHOOK_URL to .env
            </p>
          )}
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Setup: see README → Google Sheets Integration
          </p>
        </div>
      </div>
    </GlassCard>
  )
}
