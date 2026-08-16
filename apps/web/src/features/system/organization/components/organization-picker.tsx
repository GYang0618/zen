import { Checkbox, Label, ScrollArea, Skeleton } from '@zen/ui'

import { useOrganizationTree } from '../queries'

import type { OrganizationTreeNode } from '@zen/shared'

type OrganizationPickerProps = {
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

function flattenTree(
  nodes: OrganizationTreeNode[],
  depth = 0
): Array<{ id: string; name: string; depth: number }> {
  const result: Array<{ id: string; name: string; depth: number }> = []
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, depth })
    if (node.children?.length) {
      result.push(...flattenTree(node.children, depth + 1))
    }
  }
  return result
}

export function OrganizationPicker({ value, onChange, disabled = false }: OrganizationPickerProps) {
  const { data, isLoading } = useOrganizationTree()

  const items = flattenTree(data ?? [])
  const selected = new Set(value)

  const toggle = (id: string, checked: boolean) => {
    if (disabled) return
    if (checked) {
      onChange([...value, id])
      return
    }
    onChange(value.filter((item) => item !== id))
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无组织可选择</p>
  }

  return (
    <ScrollArea className="h-48 rounded-md border p-3">
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2"
            style={{ paddingInlineStart: `${item.depth * 12}px` }}
          >
            <Checkbox
              id={`org-${item.id}`}
              checked={selected.has(item.id)}
              disabled={disabled}
              onCheckedChange={(checked) => toggle(item.id, checked === true)}
            />
            <Label htmlFor={`org-${item.id}`} className="font-normal">
              {item.name}
            </Label>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
