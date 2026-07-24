import { PermissionCode } from '@zen/shared'
import { Badge, Button, cn, Input, ScrollArea, Skeleton } from '@zen/ui'
import { Plus, Search, Shield, User } from 'lucide-react'

import { Can } from '@/components/auth/can'
import { EmptyState } from '@/features/system/components'
import { getConfig } from '@/lib/config-utils'

import { roleStatusConfig } from '../data/data'

import type { Role } from '@zen/shared'

export type RoleListFilter = 'all' | 'system' | 'custom'

type RolesSidebarProps = {
  roles: Role[]
  selectedId: string | null
  keyword: string
  filter: RoleListFilter
  isLoading?: boolean
  onKeywordChange: (value: string) => void
  onFilterChange: (value: RoleListFilter) => void
  onSelect: (id: string) => void
  onCreate: () => void
}

const FILTER_OPTIONS: { value: RoleListFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'system', label: '内置' },
  { value: 'custom', label: '自定义' }
]

export function RolesSidebar({
  roles,
  selectedId,
  keyword,
  filter,
  isLoading = false,
  onKeywordChange,
  onFilterChange,
  onSelect,
  onCreate
}: RolesSidebarProps) {
  return (
    <aside className="flex max-h-[min(50vh,28rem)] min-h-0 flex-col overflow-hidden rounded-xl border bg-card lg:max-h-[calc(100svh-12rem)]">
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Shield className="size-4 text-muted-foreground" aria-hidden />
            角色定义列表
          </h2>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {roles.length}
          </Badge>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="按角色名称 / Code 过滤..."
            className="h-8 ps-8 text-xs"
            aria-label="搜索角色"
          />
        </div>

        <Can permission={PermissionCode.ROLE_CREATE}>
          <Button size="sm" className="w-full" onClick={onCreate}>
            <Plus data-icon="inline-start" />
            新建角色定义
          </Button>
        </Can>

        <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onFilterChange(option.value)}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-xs transition-colors',
                filter === option.value
                  ? 'bg-background font-medium text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[92px] w-full rounded-lg" />
            ))
          ) : roles.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="暂无角色"
              description="调整筛选条件，或新建自定义角色"
              compact
            />
          ) : (
            roles.map((role) => {
              const selected = selectedId === role.id
              const status = getConfig(roleStatusConfig, role.status)

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => onSelect(role.id)}
                  className={cn(
                    'group relative flex w-full flex-col rounded-lg p-3 text-start transition-all',
                    selected
                      ? 'bg-accent text-accent-foreground shadow-sm ring-1 ring-border'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
                      <span className="truncate">{role.name}</span>
                      {role.isSystem ? (
                        <span className="shrink-0 rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground dark:bg-zinc-800">
                          系统内置
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-muted-foreground">
                      <User className="size-3" aria-hidden />
                      {role.memberCount}
                    </span>
                  </div>

                  <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">
                    {role.description || '暂无描述'}
                  </p>

                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="truncate font-mono text-muted-foreground/70">{role.code}</span>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 font-medium',
                        status.color
                      )}
                    >
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          role.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'
                        )}
                      />
                      {role.status === 'active' ? '启用中' : '已停用'}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
