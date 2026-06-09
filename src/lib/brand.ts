/** Public asset path — respects Vite base URL (e.g. /Asahi-HRMS/ on GitHub Pages). */
export const SITE_LOGO = `${import.meta.env.BASE_URL}site_logo.png`

export const COMPANY_NAME = 'Asahi Motors London'
export const APP_NAME = 'People Management'

export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\//, '')}`
}
