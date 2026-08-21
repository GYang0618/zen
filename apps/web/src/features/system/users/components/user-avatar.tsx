import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@zen/ui'

import { presenceConfig } from '../data/data'
import { getUserDisplayName, getUserInitials, getUserPresence } from '../utils'

import type { User } from '@zen/shared'

type UserAvatarProps = {
  user: Pick<User, 'avatar' | 'lastActiveAt' | 'realName' | 'nickname' | 'username'>
  className?: string
  fallbackClassName?: string
}

export function UserAvatar({ user, className, fallbackClassName }: UserAvatarProps) {
  const name = getUserDisplayName(user)
  const presence = presenceConfig[getUserPresence(user.lastActiveAt)]

  return (
    <Avatar className={className}>
      <AvatarImage src={user.avatar ?? undefined} alt={name} />
      <AvatarFallback className={fallbackClassName}>{getUserInitials(user)}</AvatarFallback>
      <AvatarBadge
        className={presence.className}
        title={presence.label}
        aria-label={presence.label}
      />
    </Avatar>
  )
}
