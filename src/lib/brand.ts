/** Public asset path — respects Vite base URL (e.g. /Asahi-HRMS/ on GitHub Pages). */
export const SITE_LOGO = `${import.meta.env.BASE_URL}site_logo.png`

export const COMPANY_NAME = 'Asahi Motors London'
export const APP_NAME = 'People Management'
export const DEVELOPER_NAME = 'Savindu Thathsara'
export const DEVELOPER_EMAIL = 'blsthathsara@gmail.com'
export const DEVELOPER_URL = 'https://savithathsara.me'

export function isDeveloperEmail(email?: string | null): boolean {
  return email?.trim().toLowerCase() === DEVELOPER_EMAIL
}

/** Gold name styling for the developer account wherever it appears in the UI. */
export const DEVELOPER_NAME_CLASS = 'text-[#D4AF37] dark:text-[#E8C547]'

/** RGB for PDF exports (classic gold). */
export const DEVELOPER_GOLD_RGB: [number, number, number] = [212, 175, 55]

export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\//, '')}`
}
