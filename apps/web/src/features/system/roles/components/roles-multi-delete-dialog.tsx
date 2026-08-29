import { Alert, AlertDescription, AlertTitle, Input, Label } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeleteRolesMutation } from '@/features/system/roles/mutations'

import type { Role } from '@zen/shared'

type RolesMultiDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: Role[]
  skippedCount: number
  onDeleted: () => void
}

const CONFIRM_WORD = 'DELETE'

export function RolesMultiDeleteDialog({
  open,
  onOpenChange,
  items,
  skippedCount,
  onDeleted
}: RolesMultiDeleteDialogProps) {
  const { mutate: deleteRoles, isPending } = useDeleteRolesMutation()
  const [value, setValue] = useState('')
  const canDelete = value.trim() === CONFIRM_WORD && items.length > 0

  useEffect(() => {
    if (!open) return
    setValue('')
  }, [open])

  const handleDelete = () => {
    if (!canDelete) return

    deleteRoles(
      items.map((item) => item.id),
      {
        onSuccess: () => {
          toast.success(`已删除 ${items.length} 个角色`)
          setValue('')
          onOpenChange(false)
          onDeleted()
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : '删除失败')
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
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> 删除{' '}
          {items.length} 个角色
        </span>
      }
      desc={
        <div className="flex flex-col gap-4">
          <p>您确定要删除所选角色吗？角色编码将无法继续使用。此操作无法撤销。</p>
          <ul className="max-h-32 overflow-y-auto rounded-md border px-3 py-2 text-sm">
            {items.map((item) => (
              <li key={item.id} className="truncate">
                {item.name}
                <span className="ml-2 font-mono text-muted-foreground">{item.code}</span>
              </li>
            ))}
          </ul>
          <Label className="flex flex-col items-start gap-1.5">
            <span>输入“{CONFIRM_WORD}”进行确认:</span>
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={`输入 "${CONFIRM_WORD}" 以确认`}
              autoComplete="off"
            />
          </Label>
          {skippedCount > 0 ? (
            <Alert>
              <AlertTitle>已跳过 {skippedCount} 个角色</AlertTitle>
              <AlertDescription>系统内置角色或仍有成员的角色无法删除。</AlertDescription>
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
