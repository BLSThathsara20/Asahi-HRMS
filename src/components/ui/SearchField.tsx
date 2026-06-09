import { Search } from 'lucide-react'
import clsx from 'clsx'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: SearchFieldProps) {
  return (
    <div className={clsx('relative', className)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-asahi-blue/50"
      />
    </div>
  )
}
