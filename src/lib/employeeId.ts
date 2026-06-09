const PREFIX = 'AG-'

function parseEmployeeNumber(id: string): number {
  const match = id.match(/^AG-?(\d+)$/i)
  return match ? parseInt(match[1], 10) : 0
}

export function formatEmployeeId(num: number): string {
  return `${PREFIX}${String(num).padStart(3, '0')}`
}

export function getNextEmployeeIdFromList(ids: string[]): string {
  const max = ids.reduce((acc, id) => Math.max(acc, parseEmployeeNumber(id)), 0)
  return formatEmployeeId(max + 1)
}
