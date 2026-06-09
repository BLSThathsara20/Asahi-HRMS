import { useCallback, useEffect, useMemo, useState } from 'react'

export const PAGE_SIZE = 12
export const PAGE_SIZE_SM = 8

export function useListPagination<T>(
  items: T[],
  pageSize = PAGE_SIZE,
  resetDeps: unknown[] = [],
) {
  const [visibleCount, setVisibleCount] = useState(pageSize)

  useEffect(() => {
    setVisibleCount(pageSize)
    // Reset when filters/search change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, ...resetDeps])

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  )

  const hasMore = items.length > visibleCount
  const loadMore = useCallback(
    () => setVisibleCount((n) => n + pageSize),
    [pageSize],
  )

  return {
    visibleItems,
    hasMore,
    loadMore,
    showing: visibleItems.length,
    totalCount: items.length,
  }
}
