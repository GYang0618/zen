import { PermissionCode } from '@zen/shared'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@zen/ui'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import {
  useOrganizationPositions,
  useOrganizationTree
} from '@/features/system/organization-v2/queries'

import { useReplaceUserOrganizationsMutation } from '../mutations'
import { flattenOrganizationOptions, getUserDisplayName } from '../utils'

import type { User } from '@zen/shared'

type AssignUserOrganizationsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

type MembershipDraft = {
  organizationId: string
  postId: string
}

export function AssignUserOrganizationsDialog({
  open,
  onOpenChange,
  user
}: AssignUserOrganizationsDialogProps) {
  const { mutateAsync: replaceOrganizations, isPending } = useReplaceUserOrganizationsMutation()
  const { data: tree = [] } = useOrganizationTree()
  const [memberships, setMemberships] = useState<MembershipDraft[]>([])
  const [primaryOrgId, setPrimaryOrgId] = useState('')
  const [addingOrgId, setAddingOrgId] = useState('')

  const orgOptions = useMemo(() => flattenOrganizationOptions(tree), [tree])
  const selectedIds = useMemo(
    () => new Set(memberships.map((item) => item.organizationId)),
    [memberships]
  )
  const availableOptions = orgOptions.filter((option) => !selectedIds.has(option.id))

  useEffect(() => {
    if (!open) return
    setMemberships(
      user.organizations.map((item) => ({
        organizationId: item.organizationId,
        postId: item.postId ?? ''
      }))
    )
    setPrimaryOrgId(
      user.organizations.find((item) => item.isPrimary)?.organizationId ??
        user.organizations[0]?.organizationId ??
        ''
    )
    setAddingOrgId('')
  }, [open, user])

  const handleAdd = (organizationId: string) => {
    if (!organizationId || selectedIds.has(organizationId)) return
    setMemberships((prev) => [...prev, { organizationId, postId: '' }])
    if (!primaryOrgId) setPrimaryOrgId(organizationId)
    setAddingOrgId('')
  }

  const handleRemove = (organizationId: string) => {
    const next = memberships.filter((item) => item.organizationId !== organizationId)
    setMemberships(next)
    if (primaryOrgId === organizationId) {
      setPrimaryOrgId(next[0]?.organizationId ?? '')
    }
  }

  const handleSubmit = async () => {
    try {
      await replaceOrganizations({
        id: user.id,
        organizations: memberships.map((item) => ({
          organizationId: item.organizationId,
          isPrimary: item.organizationId === primaryOrgId,
          postId: item.postId || null
        }))
      })
      toast.success('组织归属已更新，目标用户需重新登录')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新组织失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>调整组织归属</DialogTitle>
          <DialogDescription>
            覆盖式同步 {getUserDisplayName(user)} 的在职组织与岗位，影响数据范围。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>添加组织</Label>
            <Select value={addingOrgId || undefined} onValueChange={handleAdd}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={availableOptions.length ? '选择要加入的组织' : '没有可添加的组织'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {availableOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {memberships.length > 0 ? (
            <div className="flex flex-col gap-3">
              {memberships.map((item) => (
                <MembershipRow
                  key={item.organizationId}
                  organizationId={item.organizationId}
                  organizationName={
                    orgOptions.find((option) => option.id === item.organizationId)?.name ??
                    item.organizationId
                  }
                  postId={item.postId}
                  onPostChange={(postId) =>
                    setMemberships((prev) =>
                      prev.map((membership) =>
                        membership.organizationId === item.organizationId
                          ? { ...membership, postId }
                          : membership
                      )
                    )
                  }
                  onRemove={() => handleRemove(item.organizationId)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">尚未分配组织。</p>
          )}

          {memberships.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Label>主职组织</Label>
              <Select value={primaryOrgId} onValueChange={setPrimaryOrgId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择主职组织" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {memberships.map((item) => (
                      <SelectItem key={item.organizationId} value={item.organizationId}>
                        {orgOptions.find((option) => option.id === item.organizationId)?.name ??
                          item.organizationId}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Can permission={PermissionCode.ORG_UPDATE}>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => {
                void handleSubmit()
              }}
            >
              保存
            </Button>
          </Can>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MembershipRow({
  organizationId,
  organizationName,
  postId,
  onPostChange,
  onRemove
}: {
  organizationId: string
  organizationName: string
  postId: string
  onPostChange: (postId: string) => void
  onRemove: () => void
}) {
  const { data: positions = [] } = useOrganizationPositions(organizationId)

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{organizationName}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          移除
        </Button>
      </div>
      <Select
        value={postId || undefined}
        onValueChange={onPostChange}
        disabled={positions.length === 0}
      >
        <SelectTrigger className="w-full">
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
    </div>
  )
}
