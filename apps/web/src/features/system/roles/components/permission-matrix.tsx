import { Button, cn, Input, ScrollArea, Skeleton, Switch } from '@zen/ui'
import { Eye, Filter, KeyRound, RotateCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { PermissionGroup } from '@zen/shared'

type PermissionMatrixProps = {
  groups: PermissionGroup[]
  value: string[]
  onChange: (codes: string[]) => void
  disabled?: boolean
  isLoading?: boolean
  /** 对话框等受限高度场景关闭内层滚动，由外层容器负责滚动 */
  scrollable?: boolean
}

type PermissionPreset = 'all' | 'readonly' | 'none'

function isReadonlyCode(code: string) {
  return /:(read|list|view|get)$/i.test(code) || /_read$/i.test(code)
}

export function PermissionMatrix({
  groups,
  value,
  onChange,
  disabled = false,
  isLoading = false,
  scrollable = true
}: PermissionMatrixProps) {
  const [keyword, setKeyword] = useState('')
  const selectedSet = new Set(value)

  const totalCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.permissions.length, 0),
    [groups]
  )

  const filteredGroups = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    if (!query) return groups

    return groups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (permission) =>
            permission.name.toLowerCase().includes(query) ||
            permission.code.toLowerCase().includes(query) ||
            (permission.description?.toLowerCase().includes(query) ?? false) ||
            group.module.toLowerCase().includes(query)
        )
      }))
      .filter((group) => group.permissions.length > 0)
  }, [groups, keyword])

  const togglePermission = (code: string, checked: boolean) => {
    if (disabled) return
    if (checked) {
      onChange([...value, code])
      return
    }
    onChange(value.filter((item) => item !== code))
  }

  const toggleModule = (codes: string[], selectAll: boolean) => {
    if (disabled) return
    if (selectAll) {
      onChange([...new Set([...value, ...codes])])
      return
    }
    const codeSet = new Set(codes)
    onChange(value.filter((item) => !codeSet.has(item)))
  }

  const applyPreset = (preset: PermissionPreset) => {
    if (disabled) return
    if (preset === 'all') {
      onChange(groups.flatMap((group) => group.permissions.map((item) => item.code)))
      return
    }
    if (preset === 'readonly') {
      onChange(
        groups.flatMap((group) =>
          group.permissions.filter((item) => isReadonlyCode(item.code)).map((item) => item.code)
        )
      )
      return
    }
    onChange([])
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!groups.length) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        暂无可分配的权限点
      </div>
    )
  }

  const groupsList = (
    <div className={cn('space-y-4 pb-2', scrollable && 'pe-3')}>
      {filteredGroups.map((group) => {
        const moduleCodes = group.permissions.map((item) => item.code)
        const selectedCount = moduleCodes.filter((code) => selectedSet.has(code)).length
        const allSelected = selectedCount === moduleCodes.length && moduleCodes.length > 0

        return (
          <section
            key={group.module}
            className="rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:border-border"
          >
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold">{group.module}</h4>
                <p className="text-xs text-muted-foreground">
                  {selectedCount} / {moduleCodes.length} 项已选
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleModule(moduleCodes, !allSelected)}
                className="rounded bg-secondary/60 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                {allSelected ? '反选全模块' : '一键全选'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {group.permissions.map((permission) => {
                const checked = selectedSet.has(permission.code)
                return (
                  <div
                    key={permission.code}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-pressed={checked}
                    onClick={() => {
                      if (disabled) return
                      togglePermission(permission.code, !checked)
                    }}
                    onKeyDown={(event) => {
                      if (disabled) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        togglePermission(permission.code, !checked)
                      }
                    }}
                    className={cn(
                      'flex cursor-pointer items-start justify-between rounded-lg border p-3 transition-all',
                      disabled && 'cursor-not-allowed opacity-60',
                      checked
                        ? 'border-primary/30 bg-primary/[0.02] shadow-sm'
                        : 'border-border/40 bg-background hover:bg-muted/40'
                    )}
                  >
                    <div className="min-w-0 space-y-1 pe-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {permission.name}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-muted-foreground/80">
                        {permission.code}
                      </p>
                      {permission.description ? (
                        <p className="text-[11px] text-muted-foreground">
                          {permission.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="pt-0.5">
                      <Switch
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={(next) => togglePermission(permission.code, next)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`切换权限 ${permission.name}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {filteredGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          没有匹配的权限点
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm md:flex-row md:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="全局检索权限节点（例如：导出、密码）..."
            className="h-8 ps-8 text-xs"
            aria-label="筛选权限"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => applyPreset('readonly')}
            title="保留查看/读取权限，关闭写操作"
          >
            <Eye data-icon="inline-start" />
            仅只读
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            onClick={() => applyPreset('none')}
          >
            <RotateCcw data-icon="inline-start" />
            清空
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => applyPreset('all')}
          >
            全选
          </Button>

          <span className="hidden text-border sm:inline" aria-hidden>
            |
          </span>

          <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
            当前已选 <strong className="text-foreground">{value.length}</strong> / {totalCount} 项
          </div>
        </div>
      </div>

      {keyword.trim() ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-foreground">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="size-3.5" aria-hidden />
            <span>
              当前筛选：<strong className="text-foreground">{keyword.trim()}</strong>
            </span>
          </div>
          <button
            type="button"
            className="font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => setKeyword('')}
          >
            清除
          </button>
        </div>
      ) : null}

      {!scrollable ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <KeyRound className="size-3.5" aria-hidden />
          <span>
            已选 {value.length} / {totalCount} 项权限
          </span>
        </div>
      ) : null}

      {scrollable ? <ScrollArea className="min-h-0 flex-1">{groupsList}</ScrollArea> : groupsList}
    </div>
  )
}
