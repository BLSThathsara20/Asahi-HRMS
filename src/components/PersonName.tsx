import clsx from 'clsx'
import { DEVELOPER_NAME_CLASS, isDeveloperEmail } from '../lib/brand'

export interface PersonLike {
  firstName: string
  lastName: string
  email?: string | null
}

interface PersonNameProps {
  person?: PersonLike
  firstName?: string
  lastName?: string
  email?: string | null
  className?: string
}

export function PersonName({
  person,
  firstName: firstNameProp,
  lastName: lastNameProp,
  email: emailProp,
  className,
}: PersonNameProps) {
  const firstName = person?.firstName ?? firstNameProp ?? ''
  const lastName = person?.lastName ?? lastNameProp ?? ''
  const email = person?.email ?? emailProp

  return (
    <span
      className={clsx(className, isDeveloperEmail(email) && DEVELOPER_NAME_CLASS)}
    >
      {firstName} {lastName}
    </span>
  )
}

export function formatPersonName(person: PersonLike): string {
  return `${person.firstName} ${person.lastName}`
}
