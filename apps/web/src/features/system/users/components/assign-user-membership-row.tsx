import {
  Button,
  cn,
  Label,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton
} from '@zen/ui'
import { Building2, X } from 'lucide-react'

import {
  getOrganizationTypeLabel,
  organizationIconConfig
} from '@/features/system/organization/data/data'
import { useOrganizationPositions } from '@/features/system/organization/queries'

type AssignUserMembershipRowProps = {
  organizationId: string
  organizationName: string
  organizationType?: string
  postId: string
  isPrimary: boolean
  onPostChange: (postId: string, postName?: string) => void
  onRemove: () => void
}

export function AssignUserMembershipRow({
  organizationId,
  organizationName,
  organizationType,
  postId,
  isPrimary,
  onPostChange,
  onRemove
}: AssignUserMembershipRowProps) {
  const { data: positions = [], isLoading } = useOrganizationPositions(organizationId)
  const config = organizationIconConfig[organizationType ?? ''] ?? {
    icon: Building2,
    defaultColor: 'text-muted-foreground'
  }
  const Icon = config.icon

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted',
              config.defaultColor
            )}
          >
            <Icon />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{organizationName}</p>
            {organizationType ? (
              <p className="truncate text-xs text-muted-foreground">
                {getOrganizationTypeLabel(organizationType)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Label className="flex cursor-pointer items-center gap-1.5 text-xs font-normal">
            <RadioGroupItem value={organizationId} />
            {isPrimary ? '主职' : '设为主职'}
          </Label>
          <Button type="button" variant="ghost" size="xs" onClick={onRemove}>
            移除
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : (
        <div className="flex items-center gap-1">
          <Select
            value={postId || undefined}
            onValueChange={(value) => {
              const selected = positions.find((position) => position.id === value)
              onPostChange(value, selected?.name)
            }}
            disabled={positions.length === 0}
          >
            <SelectTrigger className="w-full" aria-label={`${organizationName} 岗位`}>
              <SelectValue
                placeholder={positions.length === 0 ? '该组织暂无岗位' : '选择岗位（可选）'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.name} · {position.level}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {postId ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`清除 ${organizationName} 的岗位`}
              onClick={() => onPostChange('', undefined)}
            >
              <X />
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}
