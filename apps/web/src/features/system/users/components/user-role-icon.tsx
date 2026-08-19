import { cn } from '@zen/ui'
import { DynamicIcon } from 'lucide-react/dynamic'

import { getRoleIconColorClassName } from '@/features/system/roles/data/data'

import type { RoleIcon, RoleIconColor } from '@zen/shared'

type UserRoleIconProps = {
  icon: string | null | undefined
  iconColor: string | null | undefined
  className?: string
}

export function UserRoleIcon({ icon, iconColor, className }: UserRoleIconProps) {
  return (
    <span
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-xl',
        getRoleIconColorClassName(iconColor as RoleIconColor | null | undefined),
        className
      )}
    >
      <DynamicIcon name={(icon as RoleIcon | null) ?? 'shield'} />
    </span>
  )
}
