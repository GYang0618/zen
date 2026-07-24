import { cn } from '@zen/ui'

import { OrganizationPicker } from '@/features/system/components'

import { dataScopeOptions } from '../data/data'

import type { RoleDataScope } from '@zen/shared'

type RoleScopeTabProps = {
  value: RoleDataScope
  customOrgIds: string[]
  disabled?: boolean
  onScopeChange: (scope: RoleDataScope) => void
  onCustomOrgIdsChange: (ids: string[]) => void
}

export function RoleScopeTab({
  value,
  customOrgIds,
  disabled = false,
  onScopeChange,
  onCustomOrgIdsChange
}: RoleScopeTabProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            数据访问边界 (Data Access Scope)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            控制该角色在查看业务报表、人员列表及敏感业务数据时的行级过滤策略（Row-Level Security）
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {dataScopeOptions.map((option) => {
            const selected = value === option.value
            const Icon = option.icon

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => onScopeChange(option.value)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border p-4 text-start transition-all',
                  disabled && 'cursor-not-allowed opacity-60',
                  selected
                    ? 'border-primary bg-primary/[0.03] shadow-sm'
                    : 'border-border/60 bg-background hover:bg-muted/40'
                )}
              >
                <div className="mt-0.5">
                  <div
                    className={cn(
                      'flex size-4 items-center justify-center rounded-full border',
                      selected ? 'border-primary bg-primary' : 'border-input'
                    )}
                  >
                    {selected ? (
                      <div className="size-1.5 rounded-full bg-primary-foreground" />
                    ) : null}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                    {option.label}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        {value === 'custom' ? (
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-xs font-medium text-foreground">自定义组织范围</h4>
            <OrganizationPicker
              value={customOrgIds}
              onChange={onCustomOrgIdsChange}
              disabled={disabled}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
