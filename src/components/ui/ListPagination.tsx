import { Button } from './Button'

interface ListPaginationProps {
  showing: number
  total: number
  hasMore: boolean
  onLoadMore: () => void
  className?: string
}

export function ListPagination({
  showing,
  total,
  hasMore,
  onLoadMore,
  className = 'mt-4',
}: ListPaginationProps) {
  if (total === 0) return null

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <p className="text-xs text-[var(--text-muted)]">
        Showing {showing} of {total}
      </p>
      {hasMore && (
        <Button variant="ghost" size="sm" onClick={onLoadMore}>
          Show more ({total - showing} remaining)
        </Button>
      )}
    </div>
  )
}
