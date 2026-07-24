'use client'

import { Alert, AlertDescription, AlertTitle, Input, Label } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PasswordInput } from '@/components'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { authApi } from '@/features/auth/api'

import { useDeleteUsersMutation } from '../mutations'

import type { User } from '@zen/shared'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const [password, setPassword] = useState('')
  const { mutate: deleteUsers, isPending } = useDeleteUsersMutation()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.username) return
    try {
      const { stepUpToken } = await authApi.stepUp({ password })
      deleteUsers(
        { ids: [currentRow.id], stepUpToken },
        {
          onSuccess: () => {
            toast.success('用户删除成功')
            setValue('')
            setPassword('')
            onOpenChange(false)
          }
        }
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '二次确认失败')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={() => {
        void handleDelete()
      }}
      disabled={value.trim() !== currentRow.username || !password}
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
          <Label className="my-2 text-nowrap">
            登录密码（二次确认）：
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入当前登录密码"
            />
          </Label>
          <Alert variant="destructive">
            <AlertTitle>警告！</AlertTitle>
            <AlertDescription>删除属于敏感操作，需二次确认。</AlertDescription>
          </Alert>
        </div>
      }
      confirmText="删除"
      cancelBtnText="取消"
      destructive
    />
  )
}
