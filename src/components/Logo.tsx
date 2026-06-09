import clsx from 'clsx'
import { SITE_LOGO } from '../lib/brand'

interface LogoProps {
  className?: string
  alt?: string
}

export function Logo({ className, alt = 'Asahi Group Ltd' }: LogoProps) {
  return (
    <img
      src={SITE_LOGO}
      alt={alt}
      className={clsx('h-10 w-auto object-contain', className)}
    />
  )
}
