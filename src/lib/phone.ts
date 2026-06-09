/** Normalize UK phone numbers for comparison (digits only, UK local form). */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('44')) {
    digits = '0' + digits.slice(2)
  }
  return digits
}

export function phonesMatch(stored: string, entered: string): boolean {
  return normalizePhone(stored) === normalizePhone(entered)
}

export function formatPhoneDisplay(phone: string): string {
  const n = normalizePhone(phone)
  if (n.length === 11 && n.startsWith('07')) {
    return `${n.slice(0, 5)} ${n.slice(5, 8)} ${n.slice(8)}`
  }
  return phone
}
