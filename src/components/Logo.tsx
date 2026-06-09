import clsx from 'clsx'
import { COMPANY_NAME, SITE_LOGO } from '../lib/brand'

interface LogoProps {
  className?: string
  alt?: string
}

export function Logo({ className, alt = COMPANY_NAME }: LogoProps) {
  return (
    <img
      src={SITE_LOGO}
      alt={alt}
      className={clsx('h-10 w-auto object-contain', className)}
    />
  )
}
