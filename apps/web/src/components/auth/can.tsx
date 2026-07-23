import { canAccess } from '@/lib/auth/permissions'

import type { ReactNode } from 'react'

interface CanProps {
  /** 所需权限码；默认满足其一即可 */
  permission?: string | readonly string[]
  mode?: 'all' | 'any'
  children: ReactNode
  fallback?: ReactNode
}

/** 按权限控制按钮 / 区块显隐（仅 UX；后端仍强制校验） */
export function Can({ permission, mode = 'any', children, fallback = null }: CanProps) {
  const required =
    permission === undefined ? undefined : Array.isArray(permission) ? permission : [permission]

  if (!canAccess(required, mode)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
