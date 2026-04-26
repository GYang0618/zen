'use client'

import { Alert, AlertDescription, AlertTitle, Input, Label } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { showSubmittedData } from '@/lib/show-submitted-data'

import type { Role } from '../data/schema'

type RoleDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Role
}

export function RolesDeleteDialog({ open, onOpenChange, currentRow }: RoleDeleteDialogProps) {
  const [value, setValue] = useState('')

  const handleDelete = () => {
    if (value.trim() !== currentRow.code) return

    onOpenChange(false)
    showSubmittedData(currentRow, 'The following role has been deleted:')
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.code}
      title={
        <span className="text-destructive">
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> 删除角色
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            您确定要删除 <span className="font-bold">{currentRow.name}</span> 吗 ?
            <br />
            角色编码 <span className="font-bold">{currentRow.code}</span> 将无法继续使用。此操作无法撤销。
          </p>

          <Label className="my-2 text-nowrap">
            角色编码：
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="输入角色编码以确认删除"
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
