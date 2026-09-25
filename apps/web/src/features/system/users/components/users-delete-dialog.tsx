'use client'

import { Alert, AlertDescription, AlertTitle, Input, Label, toast } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'

import { useDeleteUsersMutation } from '../mutations'

import type { UserListItem } from '@zen/shared'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: UserListItem
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { mutate: deleteUsers, isPending } = useDeleteUsersMutation()

  useEffect(() => {
    if (!open) {
      setValue('')
    }
  }, [open])

  const handleDelete = () => {
    if (value.trim() !== currentRow.username) return
    deleteUsers(
      { ids: [currentRow.id] },
      {
        onSuccess: () => {
          toast.add({ title: '用户删除成功', type: 'success' })
          setValue('')
          onOpenChange(false)
        },
        onError: (error) => {
          toast.add({ title: error instanceof Error ? error.message : '删除失败', type: 'error' })
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
            <AlertDescription>此操作将删除该用户账号，请确认。</AlertDescription>
          </Alert>
        </div>
      }
      confirmText="删除"
      cancelBtnText="取消"
      destructive
    />
  )
}
