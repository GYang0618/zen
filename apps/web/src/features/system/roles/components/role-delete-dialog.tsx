import { Alert, AlertDescription, AlertTitle, Input, Label } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeleteRolesMutation } from '@/features/system/roles/mutations'

import type { Role } from '@zen/shared'

type RoleDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Role
}

export function RoleDeleteDialog({ open, onOpenChange, currentRow }: RoleDeleteDialogProps) {
  const { mutate: deleteRoles, isPending } = useDeleteRolesMutation()
  const [value, setValue] = useState('')
  const hasMembers = currentRow.memberCount > 0
  const isSystem = currentRow.isSystem || currentRow.kind === 'system'
  const canDelete = value.trim() === currentRow.code && !hasMembers && !isSystem

  useEffect(() => {
    if (!open) return
    setValue('')
  }, [open])

  const handleDelete = () => {
    if (!canDelete) return

    deleteRoles([currentRow.id], {
      onSuccess: () => {
        toast.success(`已删除角色「${currentRow.name}」`)
        setValue('')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '删除失败')
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
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> 删除角色
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            您确定要删除 <span className="font-bold">{currentRow.name}</span> 吗？
            <br />
            角色编码 <span className="font-bold">{currentRow.code}</span>{' '}
            将无法继续使用。此操作无法撤销。
          </p>

          <Label className="my-2 text-nowrap">
            角色编码：
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="输入角色编码以确认删除"
              autoComplete="off"
            />
          </Label>

          {isSystem ? (
            <Alert variant="destructive">
              <AlertTitle>系统角色</AlertTitle>
              <AlertDescription>系统内置角色不可删除。</AlertDescription>
            </Alert>
          ) : hasMembers ? (
            <Alert variant="destructive">
              <AlertTitle>存在成员</AlertTitle>
              <AlertDescription>
                该角色当前有 {currentRow.memberCount} 名成员，请先移除成员后再删除。
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
