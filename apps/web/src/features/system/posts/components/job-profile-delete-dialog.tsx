import { Alert, AlertDescription, AlertTitle, Button, Input, Label, toast } from '@zen/ui'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'

import { useDeleteJobProfileMutation, useUpdateJobProfileMutation } from '../queries'

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
  const { mutate: deleteJobProfile, isPending: isDeleting } = useDeleteJobProfileMutation()
  const { mutate: updateJobProfile, isPending: isUpdating } = useUpdateJobProfileMutation()
  const [value, setValue] = useState('')
  const hasOrganizations = currentRow.organizationCount > 0
  const canDelete = value.trim() === currentRow.code && !hasOrganizations
  const isPending = isDeleting || isUpdating

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

  const handleDeactivate = () => {
    updateJobProfile(
      { id: currentRow.id, data: { status: 'disabled' } },
      {
        onSuccess: () => {
          toast.add({ title: '岗位已停用，存量编制履历完好保留', type: 'success' })
          onOpenChange(false)
        }
      }
    )
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
            <Alert variant="destructive" className="space-y-3">
              <div>
                <AlertTitle className="flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="size-4" /> 已关联组织编制，无法物理删除
                </AlertTitle>
                <AlertDescription className="mt-1 text-xs">
                  该岗位已在 {currentRow.organizationCount}{' '}
                  个组织中设立编制。根据企业主数据规范，禁止物理删除以确保任职履历完整。
                  建议您直接将其设为停用，停用后不可新建编制。
                </AlertDescription>
              </div>
              {currentRow.status === 'active' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="bg-background text-foreground hover:bg-muted"
                  disabled={isPending}
                  onClick={handleDeactivate}
                >
                  一键设为停用
                </Button>
              ) : null}
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
