import { useQuery } from '@tanstack/react-query'
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
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@zen/ui'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { OrganizationPicker } from '@/features/system/config/components'
import { organizationApi } from '@/features/system/organization/api'

import { useReplaceUserOrganizationsMutation } from '../mutations'

import type { OrganizationTreeNode } from '@zen/shared'
import type { UserInfo } from '../api'

type AssignUserOrganizationsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserInfo
}

function flattenTree(nodes: OrganizationTreeNode[]): Array<{ id: string; name: string }> {
  const result: Array<{ id: string; name: string }> = []
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name })
    if (node.children?.length) {
      result.push(...flattenTree(node.children))
    }
  }
  return result
}

export function AssignUserOrganizationsDialog({
  open,
  onOpenChange,
  user
}: AssignUserOrganizationsDialogProps) {
  const { mutateAsync: replaceOrganizations, isPending } = useReplaceUserOrganizationsMutation()
  const { data: tree } = useQuery({
    queryKey: ['system', 'organization', 'tree'],
    queryFn: () => organizationApi.getTree(),
    enabled: open,
    staleTime: 60_000
  })
  const [orgIds, setOrgIds] = useState<string[]>([])
  const [primaryOrgId, setPrimaryOrgId] = useState<string>('')

  const orgNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of flattenTree(tree ?? [])) {
      map.set(item.id, item.name)
    }
    return map
  }, [tree])

  useEffect(() => {
    if (!open) return
    const currentIds = user.organizations.map((item) => item.organizationId)
    setOrgIds(currentIds)
    setPrimaryOrgId(
      user.organizations.find((item) => item.isPrimary)?.organizationId ?? currentIds[0] ?? ''
    )
  }, [open, user])

  const handleOrgChange = (ids: string[]) => {
    setOrgIds(ids)
    if (ids.length === 0) {
      setPrimaryOrgId('')
      return
    }
    if (!ids.includes(primaryOrgId)) {
      setPrimaryOrgId(ids[0])
    }
  }

  const handleSubmit = async () => {
    try {
      await replaceOrganizations({
        id: user.id,
        organizations: orgIds.map((organizationId) => ({
          organizationId,
          isPrimary: organizationId === primaryOrgId
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>调整组织归属</DialogTitle>
          <DialogDescription>
            覆盖式同步 {user.profile.nickname || user.profile.username} 的在职组织，影响数据范围。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>所属组织</Label>
            <OrganizationPicker value={orgIds} onChange={handleOrgChange} />
          </div>

          {orgIds.length > 0 ? (
            <div className="space-y-2">
              <Label>主职组织</Label>
              <Select value={primaryOrgId} onValueChange={setPrimaryOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择主职组织" />
                </SelectTrigger>
                <SelectContent>
                  {orgIds.map((id) => (
                    <SelectItem key={id} value={id}>
                      {orgNameMap.get(id) ?? id}
                    </SelectItem>
                  ))}
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
