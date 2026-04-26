'use client'

import { Alert, AlertDescription, AlertTitle, Input, Label } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { showSubmittedData } from '@/lib/show-submitted-data'

import type { User } from '../data/schema'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: UserDeleteDialogProps) {
  const [value, setValue] = useState('')

  const handleDelete = () => {
    if (value.trim() !== currentRow.username) return

    onOpenChange(false)
    showSubmittedData(currentRow, 'The following user has been deleted:')
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.username}
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
            此操作将从系统中永久移除具有{' '}
            <span className="font-bold">{currentRow?.role?.toUpperCase()}</span> 角色的用户。
            此操作无法撤销。
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
            <AlertDescription>请注意，此操作无法撤销。</AlertDescription>
          </Alert>
        </div>
      }
      confirmText="删除"
      cancelBtnText="取消"
      destructive
    />
  )
}
