'use no memo'

import { Alert, AlertDescription, AlertTitle, Input, Label } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components'

import { useDeleteUsersMutation } from '../mutations'

import type { User } from '@zen/shared'

type UsersMultiDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: User[]
  onDeleted: () => void
}

const CONFIRM_WORD = 'DELETE'

export function UsersMultiDeleteDialog({
  open,
  onOpenChange,
  users,
  onDeleted
}: UsersMultiDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { mutate: deleteUsers, isPending } = useDeleteUsersMutation()

  useEffect(() => {
    if (!open) return
    setValue('')
  }, [open])

  const handleDelete = () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Please type "${CONFIRM_WORD}" to confirm.`)
      return
    }

    const ids = users.map((user) => user.id)
    deleteUsers(
      { ids },
      {
        onSuccess: () => {
          setValue('')
          onOpenChange(false)
          onDeleted()
          toast.success(`已删除 ${users.length} 个用户`)
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
      handleConfirm={() => {
        handleDelete()
      }}
      disabled={value.trim() !== CONFIRM_WORD || users.length === 0}
      isLoading={isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> 删除{' '}
          {users.length} 个用户
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">您确定要删除所选用户吗？</p>
          <Label className="my-4 flex flex-col items-start gap-1.5">
            <span>输入“{CONFIRM_WORD}”进行确认:</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`输入 "${CONFIRM_WORD}" 以确认`}
            />
          </Label>
          <Alert variant="destructive">
            <AlertTitle>警告!</AlertTitle>
            <AlertDescription>
              此操作将删除选中的 {users.length} 个用户账号，请确认。
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText="删除"
      cancelBtnText="取消"
      destructive
    />
  )
}
