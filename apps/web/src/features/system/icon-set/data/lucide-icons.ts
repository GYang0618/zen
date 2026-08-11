import { icons } from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export interface LucideIconEntry {
  name: string
  kebabName: string
  Icon: LucideIcon
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

export const lucideIconEntries: LucideIconEntry[] = Object.entries(icons)
  .map(([name, Icon]) => ({
    name,
    kebabName: toKebabCase(name),
    Icon: Icon as LucideIcon
  }))
  .sort((a, b) => a.name.localeCompare(b.name))
