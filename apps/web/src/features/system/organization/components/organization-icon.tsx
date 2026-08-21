import { cn } from '@zen/ui'
import { Folder } from 'lucide-react'

import { organizationIconConfig } from '../data/data'

import type { LucideIcon } from 'lucide-react'

export function getOrganizationTypeIcon(type?: string): {
  icon: LucideIcon
  defaultColor: string
} {
  const normalizedType = (type || '').toUpperCase()
  return (
    organizationIconConfig[normalizedType] ?? {
      icon: Folder,
      defaultColor: 'text-muted-foreground'
    }
  )
}

export function OrganizationTypeIcon({ type, className }: { type?: string; className?: string }) {
  const { icon: IconComponent, defaultColor } = getOrganizationTypeIcon(type)

  return (
    <IconComponent className={cn('size-4 shrink-0 transition-colors', defaultColor, className)} />
  )
}
