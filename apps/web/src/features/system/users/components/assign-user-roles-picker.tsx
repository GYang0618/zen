import {
  Button,
  Checkbox,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  FieldError,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Label,
  ScrollArea,
  Skeleton,
  Switch
} from '@zen/ui'
import { Search, X } from 'lucide-react'

import { UserRoleIcon } from './user-role-icon'

import type { Role, UserRolePreview } from '@zen/shared'

const SELECTED_ROLE_PREVIEW_LIMIT = 4

type AssignUserRolesPickerProps = {
  isLoading: boolean
  roles: Role[]
  visibleRoles: Role[]
  selectedRoles: Array<Role | UserRolePreview>
  roleIds: string[]
  keyword: string
  showSelectedOnly: boolean
  selectionError?: string
  onKeywordChange: (value: string) => void
  onShowSelectedOnlyChange: (value: boolean) => void
  onToggle: (roleId: string, checked: boolean) => void
  onClear: () => void
}

export function AssignUserRolesPicker({
  isLoading,
  roles,
  visibleRoles,
  selectedRoles,
  roleIds,
  keyword,
  showSelectedOnly,
  selectionError,
  onKeywordChange,
  onShowSelectedOnlyChange,
  onToggle,
  onClear
}: AssignUserRolesPickerProps) {
  const hiddenSelectedCount = Math.max(selectedRoles.length - SELECTED_ROLE_PREVIEW_LIMIT, 0)
  const hasNoSelection = showSelectedOnly && roleIds.length === 0
  const emptyTitle =
    roles.length === 0 ? '暂无可用角色' : hasNoSelection ? '尚未选择角色' : '未找到匹配角色'
  const emptyDescription =
    roles.length === 0
      ? '当前没有可以分配的角色'
      : hasNoSelection
        ? '关闭“仅看已选”后继续选择角色'
        : '请尝试调整搜索关键词或筛选条件'

  if (isLoading) return <Skeleton className="min-h-40 w-full flex-1" />

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {selectedRoles.length > 0 ? (
        <section
          className="flex shrink-0 flex-col gap-2 rounded-lg border border-dashed bg-muted/35 p-2.5"
          aria-label="已选角色"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium" aria-live="polite">
              已选 {roleIds.length} 个角色
            </span>
            <Button type="button" variant="ghost" size="xs" onClick={onClear}>
              清空
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedRoles.slice(0, SELECTED_ROLE_PREVIEW_LIMIT).map((role) => (
              <Button
                key={role.id}
                type="button"
                variant="secondary"
                size="xs"
                title={`取消选择 ${role.name}`}
                aria-label={`取消选择 ${role.name}`}
                onClick={() => onToggle(role.id, false)}
              >
                <span className="max-w-32 truncate">{role.name}</span>
                <X data-icon="inline-end" />
              </Button>
            ))}
            {hiddenSelectedCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  onKeywordChange('')
                  onShowSelectedOnlyChange(true)
                }}
              >
                查看其余 {hiddenSelectedCount} 个
              </Button>
            ) : null}
          </div>
        </section>
      ) : (
        <p className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
          尚未选择角色
        </p>
      )}

      <div className="flex shrink-0 items-center gap-2">
        <InputGroup className="flex-1">
          <InputGroupInput
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="搜索角色名称、编码或描述"
            aria-label="搜索角色"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Label
          htmlFor="assign-role-selected-only"
          className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-normal"
        >
          <Switch
            id="assign-role-selected-only"
            size="sm"
            checked={showSelectedOnly}
            onCheckedChange={onShowSelectedOnlyChange}
          />
          仅看已选
        </Label>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 px-0.5 text-xs text-muted-foreground">
        <span>共 {roles.length} 个可用角色</span>
        <span>当前显示 {visibleRoles.length} 个</span>
      </div>

      <ScrollArea className="min-h-0 flex-1 overscroll-contain">
        {visibleRoles.length === 0 ? (
          <Empty className="h-full min-h-40 p-4">
            <EmptyHeader>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-2 p-1 pr-2.5">
            {visibleRoles.map((role) => {
              const checked = roleIds.includes(role.id)

              return (
                <Item key={role.id} asChild variant="outline" className="cursor-pointer">
                  <label htmlFor={`assign-role-${role.id}`}>
                    <ItemMedia>
                      <Checkbox
                        id={`assign-role-${role.id}`}
                        checked={checked}
                        onCheckedChange={(next) => onToggle(role.id, next === true)}
                        aria-label={`选择 ${role.name}`}
                      />
                    </ItemMedia>
                    <ItemMedia>
                      <UserRoleIcon
                        className="size-8 rounded-lg"
                        icon={role.icon}
                        iconColor={role.iconColor}
                      />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="min-w-0">
                        <span className="truncate">{role.name}</span>
                        <span className="font-mono text-xs font-normal text-muted-foreground">
                          {role.code}
                        </span>
                      </ItemTitle>
                      <ItemDescription>{role.description || '该角色暂无描述'}</ItemDescription>
                    </ItemContent>
                  </label>
                </Item>
              )
            })}
          </ItemGroup>
        )}
      </ScrollArea>
      {selectionError ? <FieldError>{selectionError}</FieldError> : null}
    </div>
  )
}
