'use client'

import { LogoutButton } from './logout-button'

interface LogoutButtonWrapperProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  iconOnly?: boolean
}

export function LogoutButtonWrapper({
  variant,
  size,
  className,
  iconOnly
}: LogoutButtonWrapperProps) {
  return (
    <LogoutButton
      variant={variant}
      size={size}
      className={className}
      iconOnly={iconOnly}
    />
  )
}
