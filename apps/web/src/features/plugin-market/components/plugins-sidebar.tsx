import { cn } from '@zen/ui'

import { categories, plugins } from '../data/plugins'

import type { PluginCategory } from '../types'

export function PluginsSidebar({
  category,
  onCategoryChange
}: {
  category: PluginCategory
  onCategoryChange: (category: PluginCategory) => void
}) {
  return (
    <aside className="flex flex-col gap-1">
      <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">分类</p>
      {categories.map(({ name, icon: Icon }) => (
        <button
          className={cn(
            'flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm transition-colors hover:bg-muted',
            category === name && 'bg-muted font-medium text-foreground'
          )}
          key={name}
          onClick={() => onCategoryChange(name)}
          type="button"
        >
          <Icon className="size-4 text-muted-foreground" />
          {name}
          <span className="ml-auto text-xs text-muted-foreground">
            {name === '全部'
              ? plugins.length
              : plugins.filter((plugin) => plugin.category === name).length}
          </span>
        </button>
      ))}
    </aside>
  )
}
