'use no memo'

import { createColumnHelper } from '@tanstack/react-table'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  cn,
  Progress,
  ProgressIndicator,
  ProgressTrack,
  ProgressValue
} from '@zen/ui'
import { Calendar, Hash } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import type { ColumnDef } from '@tanstack/react-table'
import type { IconName } from 'lucide-react/dynamic'

export { createColumnHelper }

export type A2uiCellType = 'text' | 'badge' | 'avatar' | 'progress' | 'tag' | 'date' | 'icon'

export interface A2uiColumnDefinition {
  key: string
  header: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  cellType?: A2uiCellType
  badgeVariantMap?: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'>
}

const dynamicColumnHelper = createColumnHelper<Record<string, unknown>>()

/**
 * 根据声明式列配置列表，使用 createColumnHelper 动态创建 TanStack ColumnDef。
 * 参考 users/posts/roles 模块中丰富单元格样式的展现形式。
 */
export function createColumnsFromDefinitions(
  definitions: A2uiColumnDefinition[]
): ColumnDef<Record<string, unknown>, unknown>[] {
  return definitions.map((def) => {
    return dynamicColumnHelper.accessor((row) => row[def.key], {
      id: def.key,
      header: def.header,
      enableSorting: def.sortable !== false,
      cell: ({ getValue }) => {
        const value = getValue()
        if (value === null || value === undefined || value === '') {
          return <span className="text-muted-foreground/60 text-xs">-</span>
        }

        const alignClass =
          def.align === 'center'
            ? 'justify-center text-center'
            : def.align === 'right'
              ? 'justify-end text-right'
              : 'justify-start text-left'

        switch (def.cellType) {
          case 'badge':
          case 'tag': {
            const strVal = String(value)
            const variant = def.badgeVariantMap?.[strVal] ?? 'outline'
            return (
              <div className={cn('flex items-center', alignClass)}>
                <Badge variant={variant} className="text-xs">
                  {strVal}
                </Badge>
              </div>
            )
          }

          case 'avatar': {
            let src: string | undefined
            let name = ''
            if (typeof value === 'object' && value !== null) {
              const obj = value as { src?: string; name?: string; avatar?: string }
              src = obj.src ?? obj.avatar
              name = obj.name ?? ''
            } else {
              src = String(value)
            }
            const fallback = name ? name.slice(0, 1).toUpperCase() : '?'
            return (
              <div className={cn('flex items-center gap-2', alignClass)}>
                <Avatar size="sm" className="size-6">
                  {src ? <AvatarImage src={src} alt={name} /> : null}
                  <AvatarFallback className="text-[10px]">{fallback}</AvatarFallback>
                </Avatar>
                {name ? <span className="truncate text-xs">{name}</span> : null}
              </div>
            )
          }

          case 'progress': {
            const num = Math.min(100, Math.max(0, Number(value) || 0))
            return (
              <div className={cn('flex items-center gap-2 min-w-24', alignClass)}>
                <Progress value={num} className="h-2 w-16">
                  <ProgressTrack className="h-1.5 w-full">
                    <ProgressIndicator className="h-full bg-primary" />
                  </ProgressTrack>
                </Progress>
                <ProgressValue className="font-mono text-xs tabular-nums">{num}%</ProgressValue>
              </div>
            )
          }

          case 'date': {
            const dateStr = String(value)
            return (
              <div
                className={cn(
                  'flex items-center gap-1 font-mono text-muted-foreground text-xs',
                  alignClass
                )}
              >
                <Calendar className="size-3 shrink-0" />
                <span>{dateStr}</span>
              </div>
            )
          }

          case 'icon': {
            const iconName = String(value)
            return (
              <div className={cn('flex items-center', alignClass)}>
                <DynamicIcon
                  name={iconName as IconName}
                  className="size-4 text-muted-foreground"
                  fallback={() => <Hash className="size-4 text-muted-foreground" />}
                />
              </div>
            )
          }

          default: {
            return <div className={cn('truncate text-sm', alignClass)}>{String(value)}</div>
          }
        }
      }
    })
  })
}
