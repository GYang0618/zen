import { Alert, AlertDescription, AlertTitle, Input, Label } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'

import { useRoles } from '../roles-provider'

import type { Role } from '../type'

type RoleDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Role
}

export function RoleDeleteDialog({ open, onOpenChange, currentRow }: RoleDeleteDialogProps) {
  const { deleteRole } = useRoles()
  const [value, setValue] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const hasMembers = currentRow.memberCount > 0
  const canDelete = value.trim() === currentRow.code && !hasMembers

  useEffect(() => {
    if (!open) return
    setValue('')
    setIsDeleting(false)
  }, [open])

  const handleDelete = () => {
    if (!canDelete) return

    setIsDeleting(true)
    try {
      deleteRole(currentRow.id)
      toast.success(`已删除角色「${currentRow.name}」`)
      setValue('')
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={!canDelete}
      isLoading={isDeleting}
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

          {hasMembers ? (
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
