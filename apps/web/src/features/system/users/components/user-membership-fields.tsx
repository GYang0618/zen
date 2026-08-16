import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@zen/ui'
import { X } from 'lucide-react'
import { useMemo } from 'react'

import {
  useOrganizationPositions,
  useOrganizationTree
} from '@/features/system/organization/queries'

import { flattenOrganizationOptions } from '../utils'

type UserMembershipFieldsProps = {
  organizationId: string
  postId: string
  onOrganizationChange: (organizationId: string) => void
  onPostChange: (postId: string) => void
  disabled?: boolean
}

export function UserMembershipFields({
  organizationId,
  postId,
  onOrganizationChange,
  onPostChange,
  disabled = false
}: UserMembershipFieldsProps) {
  const { data: tree = [] } = useOrganizationTree()
  const { data: positions = [] } = useOrganizationPositions(organizationId)
  const options = useMemo(() => flattenOrganizationOptions(tree), [tree])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Select
          value={organizationId || undefined}
          onValueChange={(value) => {
            onOrganizationChange(value)
            onPostChange('')
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full" aria-label="选择组织">
            <SelectValue placeholder="选择主职组织（可选）" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {organizationId ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="清除组织"
            disabled={disabled}
            onClick={() => {
              onOrganizationChange('')
              onPostChange('')
            }}
          >
            <X />
          </Button>
        ) : null}
      </div>

      {organizationId ? (
        <Select
          value={postId || undefined}
          onValueChange={onPostChange}
          disabled={disabled || positions.length === 0}
        >
          <SelectTrigger className="w-full" aria-label="选择岗位">
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
      ) : null}
    </div>
  )
}
