import { Alert, AlertDescription, AlertTitle, Input, Label } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'

import { useDeleteJobProfileMutation } from '../queries'

import type { JobProfile } from '@zen/shared'

type JobProfileDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: JobProfile
}

export function JobProfileDeleteDialog({
  open,
  onOpenChange,
  currentRow
}: JobProfileDeleteDialogProps) {
  const { mutate: deleteJobProfile, isPending } = useDeleteJobProfileMutation()
  const [value, setValue] = useState('')
  const hasOrganizations = currentRow.organizationCount > 0
  const canDelete = value.trim() === currentRow.code && !hasOrganizations

  useEffect(() => {
    if (!open) return
    setValue('')
  }, [open])

  const handleDelete = () => {
    if (!canDelete) return

    deleteJobProfile(currentRow.id, {
      onSuccess: () => {
        setValue('')
        onOpenChange(false)
      }
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={!canDelete}
      isLoading={isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> 删除岗位
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            您确定要删除 <span className="font-bold">{currentRow.name}</span> 吗？
            <br />
            岗位编码 <span className="font-bold">{currentRow.code}</span>{' '}
            将无法继续使用。此操作无法撤销。
          </p>

          <Label className="my-2 text-nowrap">
            岗位编码：
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="输入岗位编码以确认删除"
              autoComplete="off"
            />
          </Label>

          {hasOrganizations ? (
            <Alert variant="destructive">
              <AlertTitle>已关联组织</AlertTitle>
              <AlertDescription>
                该岗位已关联 {currentRow.organizationCount}{' '}
                个组织编制，请先在组织中解除关联后再删除；或改为停用。
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>警告！</AlertTitle>
              <AlertDescription>请注意，此操作无法撤销。</AlertDescription>
            </Alert>
          )}
        </div>
      }
      confirmText="删除"
      cancelBtnText="取消"
      destructive
    />
  )
}
