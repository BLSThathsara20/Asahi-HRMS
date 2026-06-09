import clsx from 'clsx'
import { getDepartmentColor } from '../lib/types'
import type { Employee } from '../lib/types'

interface EmployeeAvatarProps {
  employee: Employee
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl' }

export function EmployeeAvatar({ employee, size = 'md' }: EmployeeAvatarProps) {
  const initials = `${employee.firstName[0]}${employee.lastName[0]}`
  const color = getDepartmentColor(employee.department)

  if (employee.avatarUrl) {
    return (
      <img
        src={employee.avatarUrl}
        alt={`${employee.firstName} ${employee.lastName}`}
        className={clsx('rounded-full object-cover', SIZES[size])}
      />
    )
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full font-semibold text-white',
        SIZES[size],
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}
