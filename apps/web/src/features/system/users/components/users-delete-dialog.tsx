'use client'

import { Alert, AlertDescription, AlertTitle, Input, Label } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'

import { useDeleteUsersMutation } from '../mutations'

import type { User } from '@zen/shared'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { mutate: deleteUsers, isPending } = useDeleteUsersMutation()

  const handleDelete = () => {
    if (value.trim() !== currentRow.username) return
    deleteUsers([currentRow.id], {
      onSuccess: () => {
        toast.success('用户删除成功')
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
      disabled={value.trim() !== currentRow.username}
      isLoading={isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> 删除用户
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            您确定要删除 <span className="font-bold">{currentRow.username}</span> 吗 ?
            <br />
            此操作将把具有 <span className="font-bold">{currentRow?.role?.toUpperCase()}</span>{' '}
            角色的用户。 删除后可在后台通过恢复接口找回。
          </p>

          <Label className="my-2 text-nowrap">
            用户名：
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="输入用户名以确认删除"
            />
          </Label>

          <Alert variant="destructive">
            <AlertTitle>警告！</AlertTitle>
            <AlertDescription>请确认删除目标用户。</AlertDescription>
          </Alert>
        </div>
      }
      confirmText="删除"
      cancelBtnText="取消"
      destructive
    />
  )
}
