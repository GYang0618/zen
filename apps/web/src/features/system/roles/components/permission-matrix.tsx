import { isReadonlyPermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Skeleton,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import { CheckCheck, Eraser, Eye, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { PermissionGroup } from '@zen/shared'

type PermissionPreset = 'all' | 'readonly' | 'none'

type PermissionMatrixProps = {
  groups: PermissionGroup[]
  value: string[]
  onChange: (codes: string[]) => void
  disabled?: boolean
  isLoading?: boolean
}

function isAssignablePermission(status: PermissionGroup['permissions'][number]['status']) {
  return status === 'active'
}

function applyModulePreset(
  current: string[],
  moduleCodes: string[],
  preset: PermissionPreset
): string[] {
  const moduleSet = new Set(moduleCodes)
  const withoutModule = current.filter((code) => !moduleSet.has(code))

  if (preset === 'none') return withoutModule
  if (preset === 'all') return [...new Set([...withoutModule, ...moduleCodes])]

  const readonlyCodes = moduleCodes.filter(isReadonlyPermissionCode)
  return [...new Set([...withoutModule, ...readonlyCodes])]
}

function collectAssignableCodes(groups: PermissionGroup[]): string[] {
  return groups.flatMap((group) =>
    group.permissions.filter((item) => isAssignablePermission(item.status)).map((item) => item.code)
  )
}

export function PermissionMatrix({
  groups,
  value,
  onChange,
  disabled = false,
  isLoading = false
}: PermissionMatrixProps) {
  const [keyword, setKeyword] = useState('')
  const selectedSet = useMemo(() => new Set(value), [value])

  const assignableCodes = useMemo(() => collectAssignableCodes(groups), [groups])
  const assignableSet = useMemo(() => new Set(assignableCodes), [assignableCodes])
  const totalCount = assignableCodes.length
  const selectedAssignableCount = useMemo(
    () => value.reduce((count, code) => count + (assignableSet.has(code) ? 1 : 0), 0),
    [assignableSet, value]
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
      onChange(value.includes(code) ? value : [...value, code])
      return
    }
    onChange(value.filter((item) => item !== code))
  }

  const applyGlobalPreset = (preset: PermissionPreset) => {
    if (disabled) return
    if (preset === 'all') {
      onChange(assignableCodes)
      return
    }
    if (preset === 'readonly') {
      onChange(
        groups.flatMap((group) =>
          group.permissions
            .filter(
              (item) => isAssignablePermission(item.status) && isReadonlyPermissionCode(item.code)
            )
            .map((item) => item.code)
        )
      )
      return
    }
    onChange([])
  }

  const applyLocalPreset = (moduleCodes: string[], preset: PermissionPreset) => {
    if (disabled) return
    onChange(applyModulePreset(value, moduleCodes, preset))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-3xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <InputGroup className="h-9 flex-1 rounded-full">
          <InputGroupInput
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="全局检索权限节点，如用户、system:user:create"
            aria-label="筛选权限"
            disabled={disabled}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex gap-2">
          <Button
            type="button"
            size="lg"
            variant="outline"
            aria-label="全选"
            className="rounded-full"
            disabled={disabled}
            onClick={() => applyGlobalPreset('all')}
          >
            <CheckCheck />
            全选
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            aria-label="仅只读"
            className="rounded-full"
            title="仅保留查看/读取类权限"
            disabled={disabled}
            onClick={() => applyGlobalPreset('readonly')}
          >
            <Eye />
            仅只读
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            aria-label="清除"
            className="rounded-full"
            disabled={disabled}
            onClick={() => applyGlobalPreset('none')}
          >
            <Eraser />
            清除
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        当前已选 {selectedAssignableCount} / {totalCount} 项
      </div>

      {filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          没有匹配的权限点
        </div>
      ) : null}

      {filteredGroups.map((group) => {
        const fullModulePermissions =
          groups.find((item) => item.module === group.module)?.permissions ?? group.permissions
        const fullModuleCodes = fullModulePermissions
          .filter((item) => isAssignablePermission(item.status))
          .map((item) => item.code)
        const selectedCount = fullModuleCodes.filter((code) => selectedSet.has(code)).length

        return (
          <Card key={group.module} className="group rounded-3xl">
            <CardHeader>
              <CardTitle>{group.module}</CardTitle>
              <CardDescription>
                {selectedCount} / {fullModuleCodes.length} 项已选
              </CardDescription>
              <CardAction className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${group.module}全选`}
                        disabled={disabled}
                        onClick={() => applyLocalPreset(fullModuleCodes, 'all')}
                      >
                        <CheckCheck />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>全选</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${group.module}仅只读`}
                        disabled={disabled}
                        onClick={() => applyLocalPreset(fullModuleCodes, 'readonly')}
                      >
                        <Eye />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>只读</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${group.module}清除`}
                        disabled={disabled}
                        onClick={() => applyLocalPreset(fullModuleCodes, 'none')}
                      >
                        <Eraser />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>清除</TooltipContent>
                  </Tooltip>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 gap-4 @xl/content:grid-cols-2">
                {group.permissions.map((item) => {
                  const checked = selectedSet.has(item.code)
                  const assignable = isAssignablePermission(item.status)
                  return (
                    <FieldLabel
                      key={item.code}
                      htmlFor={item.code}
                      className="min-w-0 has-[>[data-slot=field]]:rounded-2xl"
                    >
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>
                            {item.name}
                            <Badge variant="ghost" className="text-xs text-muted-foreground">
                              {item.code}
                            </Badge>
                          </FieldTitle>
                          <FieldDescription>{item.description ?? ''}</FieldDescription>
                        </FieldContent>
                        <Switch
                          id={item.code}
                          checked={checked}
                          disabled={disabled || (!assignable && !checked)}
                          onCheckedChange={(next) => togglePermission(item.code, next)}
                          aria-label={`切换权限 ${item.name}`}
                        />
                      </Field>
                    </FieldLabel>
                  )
                })}
              </FieldGroup>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
