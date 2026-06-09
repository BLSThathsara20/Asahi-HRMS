import { useEffect, useState } from 'react'
import { getOfficeHoursTheme, type OfficeHoursTheme } from '../lib/officeHours'

export function useOfficeHours(): OfficeHoursTheme {
  const [theme, setTheme] = useState(() => getOfficeHoursTheme())

  useEffect(() => {
    const update = () => setTheme(getOfficeHoursTheme())
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [])

  return theme
}
