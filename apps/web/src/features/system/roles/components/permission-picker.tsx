import { Checkbox, Label, ScrollArea, Skeleton } from '@zen/ui'

import { usePermissionsQuery } from '../queries'

type PermissionPickerProps = {
  value: string[]
  onChange: (codes: string[]) => void
  disabled?: boolean
}

export function PermissionPicker({ value, onChange, disabled = false }: PermissionPickerProps) {
  const { data: groups, isLoading } = usePermissionsQuery(true)
  const selectedSet = new Set(value)

  const togglePermission = (code: string, checked: boolean) => {
    if (disabled) return
    if (checked) {
      onChange([...value, code])
      return
    }
    onChange(value.filter((item) => item !== code))
  }

  const toggleModule = (codes: string[], checked: boolean) => {
    if (disabled) return
    if (checked) {
      onChange([...new Set([...value, ...codes])])
      return
    }
    const codeSet = new Set(codes)
    onChange(value.filter((item) => !codeSet.has(item)))
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!groups?.length) {
    return <p className="text-sm text-muted-foreground">暂无可分配的权限</p>
  }

  return (
    <ScrollArea className="h-56 rounded-md border p-3">
      <div className="space-y-4">
        {groups.map((group) => {
          const moduleCodes = group.permissions.map((item) => item.code)
          const selectedCount = moduleCodes.filter((code) => selectedSet.has(code)).length
          const allSelected = selectedCount === moduleCodes.length && moduleCodes.length > 0
          const partiallySelected = selectedCount > 0 && !allSelected

          return (
            <div key={group.module} className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`module-${group.module}`}
                  checked={allSelected ? true : partiallySelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => toggleModule(moduleCodes, checked === true)}
                  disabled={disabled}
                />
                <Label htmlFor={`module-${group.module}`} className="font-medium">
                  {group.module}
                </Label>
              </div>
              <div className="ms-6 space-y-2">
                {group.permissions.map((permission) => (
                  <div key={permission.code} className="flex items-start gap-2">
                    <Checkbox
                      id={permission.code}
                      checked={selectedSet.has(permission.code)}
                      onCheckedChange={(checked) =>
                        togglePermission(permission.code, checked === true)
                      }
                      disabled={disabled}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor={permission.code} className="font-normal">
                        {permission.name}
                      </Label>
                      <span className="text-xs text-muted-foreground">{permission.code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
