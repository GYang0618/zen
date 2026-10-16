import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast
} from '@zen/ui'
import { ArrowRight, Briefcase, Building2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useBatchTransferMembers, useOrganizationPositions, useOrganizationTree } from '../queries'
import { OrganizationParentSelect } from './organization-parent-select'

import type { OrganizationMember } from '../type'

interface OrganizationBatchTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  selectedMembers: OrganizationMember[]
  onSuccess?: () => void
}

export function OrganizationBatchTransferDialog({
  open,
  onOpenChange,
  organizationId,
  selectedMembers,
  onSuccess
}: OrganizationBatchTransferDialogProps) {
  const { data: tree = [] } = useOrganizationTree()
  const [targetOrgId, setTargetOrgId] = useState('')
  const [targetPosId, setTargetPosId] = useState('none')
  const [error, setError] = useState<string | null>(null)

  const { data: targetPositions = [], isLoading: isPositionsLoading } =
    useOrganizationPositions(targetOrgId)

  const batchTransfer = useBatchTransferMembers(organizationId)

  const excludeIds = useMemo(() => new Set([organizationId]), [organizationId])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTargetOrgId('')
      setTargetPosId('none')
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  const handleTransfer = async () => {
    if (!targetOrgId) {
      setError('请选择目标组织')
      return
    }

    if (selectedMembers.length === 0) {
      setError('请至少选择一名需要调动的成员')
      return
    }

    try {
      await batchTransfer.mutateAsync({
        userIds: selectedMembers.map((m) => m.id),
        targetOrganizationId: targetOrgId,
        targetPostId: targetPosId === 'none' ? null : targetPosId
      })
      toast.add({ title: `成功调动 ${selectedMembers.length} 名成员`, type: 'success' })
      onSuccess?.()
      handleOpenChange(false)
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : '批量调动成员失败', type: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle>批量调动成员</DialogTitle>
              <DialogDescription>
                将选中的 {selectedMembers.length} 名成员从当前部门批量划转至新部门
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 选中的成员缩略列表 */}
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>待调动成员 ({selectedMembers.length}人)</span>
            </div>
            <ScrollArea className="max-h-28">
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs shadow-xs"
                  >
                    <Avatar className="size-4">
                      <AvatarImage src={member.avatar ?? undefined} />
                      <AvatarFallback className="text-[9px]">
                        {(member.nickname ?? member.username).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">
                      {member.nickname ?? member.username}
                    </span>
                    {member.post ? (
                      <span className="text-[11px] text-muted-foreground">({member.post})</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 目标组织选择 */}
          <Field className="space-y-1.5">
            <FieldLabel className="text-sm font-medium">
              <Building2 className="mr-1 inline-block size-4 text-muted-foreground" />
              目标部门 / 团队 <span className="text-destructive">*</span>
            </FieldLabel>
            <OrganizationParentSelect
              value={targetOrgId}
              onValueChange={(val) => {
                setTargetOrgId(val)
                setTargetPosId('none')
                setError(null)
              }}
              tree={tree}
              excludeIds={excludeIds}
              placeholder="请选择目标部门或项目组"
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>

          {/* 目标岗位选择 */}
          {targetOrgId ? (
            <Field className="space-y-1.5">
              <FieldLabel className="text-sm font-medium">
                <Briefcase className="mr-1 inline-block size-4 text-muted-foreground" />
                调入目标岗位 (可选)
              </FieldLabel>
              <Select value={targetPosId} onValueChange={(val) => setTargetPosId(val ?? 'none')}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={isPositionsLoading ? '加载岗位中…' : '保持未分配或选择目标岗位'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">暂不分配岗位 (清空原岗位)</SelectItem>
                    {targetPositions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>
                        {pos.name} ({pos.code}) · 缺编{' '}
                        {Math.max(pos.headcount - pos.activeCount, 0)} 人
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                若不指定目标岗位，成员调入新部门后将处于“待定岗”状态。
              </p>
            </Field>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={batchTransfer.isPending}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={() => void handleTransfer()}
            disabled={batchTransfer.isPending || !targetOrgId}
          >
            {batchTransfer.isPending ? '正在调动…' : '确认调动'}
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
