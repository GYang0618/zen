'use client'

import { Alert, AlertDescription, AlertTitle, Input, Label } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'

import { useDeleteRolesMutation } from '../mutations'

import type { Role } from '@zen/shared'

type RoleDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Role
}

export function RolesDeleteDialog({ open, onOpenChange, currentRow }: RoleDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { mutate: deleteRoles, isPending } = useDeleteRolesMutation()

  const handleDelete = () => {
    if (value.trim() !== currentRow.code) return

    deleteRoles([currentRow.id], {
      onSuccess: () => {
        toast.success('角色删除成功')
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
      disabled={value.trim() !== currentRow.code || currentRow.isSystem}
      isLoading={isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> 删除角色
        </span>
      }
      desc={
        <div className="space-y-4">
          {currentRow.isSystem ? (
            <Alert variant="destructive">
              <AlertTitle>无法删除</AlertTitle>
              <AlertDescription>系统内置角色不可删除。</AlertDescription>
            </Alert>
          ) : (
            <>
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
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="输入角色编码以确认删除"
                />
              </Label>

              {currentRow.memberCount > 0 ? (
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
            </>
          )}
        </div>
      }
      confirmText="删除"
      cancelBtnText="取消"
      destructive
    />
  )
}
