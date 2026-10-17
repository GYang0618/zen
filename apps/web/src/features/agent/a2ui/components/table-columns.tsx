'use no memo'

import { createColumnHelper } from '@tanstack/react-table'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Badge,
  cn,
  Progress
} from '@zen/ui'
import { Calendar, Hash, ShieldCheck } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import type { ColumnDef, SortingFn } from '@tanstack/react-table'
import type { IconName } from 'lucide-react/dynamic'

export { createColumnHelper }

export type A2uiCellType =
  | 'text'
  | 'composite'
  | 'badge'
  | 'tag'
  | 'avatar'
  | 'avatarGroup'
  | 'iconText'
  | 'progress'
  | 'date'
  | 'icon'

export interface A2uiColumnDefinition {
  key: string
  header: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  cellType?: A2uiCellType
  // 复合单元格配置（图标/头像 + 主标题 + 副标题）
  titleKey?: string
  subtitleKey?: string
  iconKey?: string
  icon?: string
  iconColorKey?: string
  iconColor?: string
  avatarKey?: string
  avatar?: string
  // 数量/成员计数配置
  countKey?: string
  // 标签颜色/变体配置
  badgeVariantMap?: Record<string, string>
}

const dynamicColumnHelper = createColumnHelper<Record<string, unknown>>()

export const ICON_COLOR_THEMES: Record<string, string> = {
  slate: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  sky: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  blue: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  teal: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  orange: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  red: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  indigo: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  purple: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  primary: 'bg-primary/15 text-primary'
}

export function getIconColorClassName(color?: string | null): string {
  if (!color) return 'bg-muted-foreground/15 text-muted-foreground'
  return ICON_COLOR_THEMES[color.toLowerCase()] ?? 'bg-muted-foreground/15 text-muted-foreground'
}

export const TAG_SEMANTIC_STYLES: Record<string, string> = {
  success:
    'border-green-600/25 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-950/50 dark:text-green-300',
  warning:
    'border-amber-600/25 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-300',
  destructive:
    'border-red-600/25 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/50 dark:text-red-300',
  info: 'border-sky-600/25 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-950/50 dark:text-sky-300',
  muted:
    'border-slate-500/25 bg-slate-50 text-slate-700 dark:border-slate-600/30 dark:bg-slate-900/50 dark:text-slate-300'
}

export function resolveTagClassName(text: string, customVariant?: string): string {
  if (customVariant && TAG_SEMANTIC_STYLES[customVariant]) {
    return TAG_SEMANTIC_STYLES[customVariant]
  }

  const lower = text.trim().toLowerCase()
  if (/^(激活|正常|有效|启用|在线|通过|成功|已发布|active|success|enabled|online)$/i.test(lower)) {
    return TAG_SEMANTIC_STYLES.success
  }
  if (/^(过期|停用|禁用|失败|异常|危险|拒绝|expired|disabled|danger|error|failed)$/i.test(lower)) {
    return TAG_SEMANTIC_STYLES.destructive
  }
  if (/^(冻结|待审核|待处理|审核中|警告|进行中|pending|warning|frozen)$/i.test(lower)) {
    return TAG_SEMANTIC_STYLES.warning
  }
  if (/^(锁定|只读|离线|草稿|默认|关闭|locked|readonly|offline|draft|muted)$/i.test(lower)) {
    return TAG_SEMANTIC_STYLES.muted
  }

  return TAG_SEMANTIC_STYLES.muted
}

export function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined
  if (path in (obj as Record<string, unknown>)) {
    return (obj as Record<string, unknown>)[path]
  }
  const keys = path.split('.')
  let current: unknown = obj
  for (const k of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[k]
  }
  return current
}

type ComparablePrimitive = { type: 'number'; value: number } | { type: 'string'; value: string }

export function extractComparableValue(val: unknown): ComparablePrimitive | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return { type: 'number', value: val }
  if (typeof val === 'boolean') return { type: 'number', value: val ? 1 : 0 }

  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return { type: 'number', value: val.length }
    }
    const record = val as Record<string, unknown>
    if (typeof record.count === 'number') return { type: 'number', value: record.count }
    if (typeof record.total === 'number') return { type: 'number', value: record.total }
    if (typeof record.memberCount === 'number') return { type: 'number', value: record.memberCount }
    if (typeof record.permissionCount === 'number')
      return { type: 'number', value: record.permissionCount }
    if (record.title !== undefined) return extractComparableValue(record.title)
    if (record.name !== undefined) return extractComparableValue(record.name)
    if (record.label !== undefined) return extractComparableValue(record.label)
    if (record.value !== undefined) return extractComparableValue(record.value)
  }

  const str = String(val).trim()
  if (!str) return null

  // 匹配带单位的数字，例如 "38 项", "100%", "28 人"
  const numMatch = str.match(/^(-?\d+(\.\d+)?)\s*([^\d\s]*)$/)
  if (numMatch && !Number.isNaN(Number(numMatch[1]))) {
    return { type: 'number', value: Number(numMatch[1]) }
  }

  if (str === '长期有效' || str === '永久') {
    return { type: 'number', value: Number.POSITIVE_INFINITY }
  }

  const normalizedDateStr = str.replace(/[年月日]/g, (m) => (m === '日' ? '' : '-'))
  const parsedDate = Date.parse(normalizedDateStr)
  if (!Number.isNaN(parsedDate) && normalizedDateStr.includes('-')) {
    return { type: 'number', value: parsedDate }
  }

  return { type: 'string', value: str }
}

export function compareValues(a: unknown, b: unknown): number {
  const compA = extractComparableValue(a)
  const compB = extractComparableValue(b)

  if (compA === null && compB === null) return 0
  if (compA === null) return 1
  if (compB === null) return -1

  if (compA.type === 'number' && compB.type === 'number') {
    return compA.value - compB.value
  }

  return String(compA.value).localeCompare(String(compB.value), 'zh-CN', { numeric: true })
}

export const smartCompareFn: SortingFn<Record<string, unknown>> = (rowA, rowB, columnId) => {
  const valA = rowA.getValue(columnId)
  const valB = rowB.getValue(columnId)
  return compareValues(valA, valB)
}

/**
 * 根据声明式列配置列表，使用 createColumnHelper 动态创建 TanStack ColumnDef。
 * 支持复合单元格（多字段合并在一列：图标/头像+标题+副标题）、状态胶囊标签、头像组、带图标数值展示及智能排序。
 */
export function createColumnsFromDefinitions(
  definitions: A2uiColumnDefinition[]
): ColumnDef<Record<string, unknown>, unknown>[] {
  return definitions.map((def) => {
    return dynamicColumnHelper.accessor((row) => getNestedValue(row, def.key), {
      id: def.key,
      header: def.header,
      enableSorting: def.sortable !== false,
      sortingFn: smartCompareFn,
      cell: ({ getValue, row }) => {
        const value = getValue()
        const rowObj = (
          typeof row.original === 'object' && row.original !== null ? row.original : {}
        ) as Record<string, unknown>

        const alignClass =
          def.align === 'center'
            ? 'justify-center text-center'
            : def.align === 'right'
              ? 'justify-end text-right'
              : 'justify-start text-left'

        // 智能判断是否作为复合单元格展示：
        // 1. 显式声明 cellType === 'composite'
        // 2. 配置了 subtitleKey, iconKey, avatarKey
        // 3. 单元格值本身为对象并包含 title/subtitle/icon/avatar 等多字段
        const isComposite =
          def.cellType === 'composite' ||
          Boolean(def.subtitleKey || def.iconKey || def.avatarKey) ||
          (typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            ('title' in value || 'subtitle' in value || 'icon' in value || 'avatar' in value))

        if (isComposite) {
          const valObj = (typeof value === 'object' && value !== null ? value : {}) as Record<
            string,
            unknown
          >

          const title = String(
            valObj.title ??
              (def.titleKey ? rowObj[def.titleKey] : undefined) ??
              valObj.name ??
              (typeof value === 'string' || typeof value === 'number'
                ? value
                : (rowObj[def.key] ?? ''))
          )

          const subtitle = String(
            valObj.subtitle ??
              valObj.code ??
              valObj.description ??
              valObj.username ??
              (def.subtitleKey ? rowObj[def.subtitleKey] : '') ??
              ''
          )

          const iconName = (valObj.icon ??
            (def.iconKey ? rowObj[def.iconKey] : undefined) ??
            def.icon) as string | undefined

          const iconColor = (valObj.iconColor ??
            (def.iconColorKey ? rowObj[def.iconColorKey] : undefined) ??
            def.iconColor) as string | undefined

          const avatarSrc = (valObj.avatar ??
            valObj.src ??
            (def.avatarKey ? rowObj[def.avatarKey] : undefined) ??
            def.avatar) as string | undefined

          return (
            <div className={cn('flex items-center gap-3', alignClass)}>
              {avatarSrc ? (
                <Avatar size="sm" className="size-9 shrink-0">
                  <AvatarImage src={String(avatarSrc)} alt={title} />
                  <AvatarFallback className="text-xs">
                    {title ? title.slice(0, 1).toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
              ) : iconName ? (
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    getIconColorClassName(iconColor)
                  )}
                >
                  <DynamicIcon
                    name={iconName as IconName}
                    className="size-4"
                    fallback={() => <Hash className="size-4" />}
                  />
                </div>
              ) : null}
              <span className="flex min-w-0 flex-col text-left">
                <span className="truncate font-medium text-foreground text-sm">{title}</span>
                {subtitle ? (
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {subtitle}
                  </span>
                ) : null}
              </span>
            </div>
          )
        }

        if (value === null || value === undefined || value === '') {
          return <span className="text-muted-foreground/60 text-xs">-</span>
        }

        switch (def.cellType) {
          case 'badge':
          case 'tag': {
            const items = Array.isArray(value) ? value : [value]
            return (
              <div className={cn('flex flex-wrap items-center gap-1.5', alignClass)}>
                {items.map((item, idx) => {
                  const strVal = String(item)
                  const customVariant = def.badgeVariantMap?.[strVal]
                  const tagClass = resolveTagClassName(strVal, customVariant)
                  return (
                    <Badge
                      key={`${strVal}-${idx}`}
                      variant="outline"
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-normal border transition-colors',
                        tagClass
                      )}
                    >
                      {strVal}
                    </Badge>
                  )
                })}
              </div>
            )
          }

          case 'avatarGroup': {
            let totalCount = 0
            let previewList: Array<{ id?: string | number; name?: string; avatar?: string }> = []

            if (typeof value === 'object' && value !== null) {
              if (Array.isArray(value)) {
                totalCount = value.length
                previewList = value.slice(0, 4)
              } else {
                const obj = value as Record<string, unknown>
                totalCount = Number(
                  obj.memberCount ??
                    obj.count ??
                    obj.total ??
                    (def.countKey ? rowObj[def.countKey] : 0)
                )
                const rawList = (obj.memberPreview ??
                  obj.members ??
                  obj.avatars ??
                  obj.list ??
                  []) as unknown[]
                if (Array.isArray(rawList)) {
                  previewList = rawList.slice(0, 4) as typeof previewList
                } else if (obj.name || obj.avatar) {
                  previewList = [{ name: String(obj.name ?? ''), avatar: String(obj.avatar ?? '') }]
                }
              }
            } else if (
              typeof value === 'number' ||
              (typeof value === 'string' && /^\d+/.test(value))
            ) {
              totalCount = Number.parseInt(String(value), 10) || 0
            }

            if (totalCount === 0) {
              return (
                <div className={cn('flex items-center', alignClass)}>
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              )
            }

            const overflowCount = Math.max(0, totalCount - previewList.length)

            return (
              <div className={cn('flex items-center gap-2', alignClass)}>
                {previewList.length > 0 ? (
                  <AvatarGroup>
                    {previewList.map((m, idx) => {
                      const displayName = m.name ?? ''
                      const fallback = displayName ? displayName.slice(0, 1).toUpperCase() : '?'
                      return (
                        <Avatar key={m.id ?? idx} size="sm" className="size-6">
                          {m.avatar ? <AvatarImage src={m.avatar} alt={displayName} /> : null}
                          <AvatarFallback className="text-[10px]">{fallback}</AvatarFallback>
                        </Avatar>
                      )
                    })}
                    {overflowCount > 0 ? (
                      <AvatarGroupCount className="size-6 text-[10px]">
                        +{overflowCount}
                      </AvatarGroupCount>
                    ) : null}
                  </AvatarGroup>
                ) : null}
                <span className="text-xs text-muted-foreground tabular-nums">{totalCount}</span>
              </div>
            )
          }

          case 'iconText': {
            const strVal = String(value)
            const iconName = (def.icon ?? 'shield-check') as IconName
            return (
              <div className={cn('inline-flex items-center gap-1.5 text-sm', alignClass)}>
                <DynamicIcon
                  name={iconName}
                  className="size-3.5 shrink-0 text-muted-foreground"
                  fallback={() => <ShieldCheck className="size-3.5 text-muted-foreground" />}
                />
                <span>{strVal}</span>
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
              <div className={cn('flex min-w-24 items-center gap-2', alignClass)}>
                <Progress value={num} className="w-16" />
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{num}%</span>
              </div>
            )
          }

          case 'date': {
            const dateStr = String(value)
            if (dateStr === '长期有效' || dateStr === '永久') {
              return <div className={cn('text-sm text-nowrap', alignClass)}>{dateStr}</div>
            }
            return (
              <div
                className={cn(
                  'flex items-center gap-1 font-mono text-muted-foreground text-xs text-nowrap',
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
