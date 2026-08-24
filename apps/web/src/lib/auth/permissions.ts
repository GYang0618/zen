import { hasAllPermissions, hasAnyPermission } from '@zen/shared'

import { useAuthStore } from '@/stores'

export const SUPER_ADMIN_ROLE_CODE = 'super_admin'

export function isSuperAdmin(): boolean {
  return useAuthStore.getState().user?.role === SUPER_ADMIN_ROLE_CODE
}

export function getGrantedPermissions(): string[] {
  return useAuthStore.getState().user?.permissions ?? []
}

export function canAccess(required?: readonly string[], mode: 'all' | 'any' = 'any'): boolean {
  if (!required || required.length === 0) return true
  if (isSuperAdmin()) return true
  const granted = getGrantedPermissions()
  return mode === 'all' ? hasAllPermissions(granted, required) : hasAnyPermission(granted, required)
}

export function assertRoutePermissions(required?: readonly string[]): void {
  if (!canAccess(required, 'any')) {
    throw new Error('FORBIDDEN')
  }
}
