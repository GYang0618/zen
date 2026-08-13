import { PermissionCode } from '@zen/shared'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  ScrollArea,
  Skeleton
} from '@zen/ui'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { PasswordInput } from '@/components'
import { Can } from '@/components/auth/can'
import { authApi } from '@/features/auth/api'

import { useAssignUserRolesMutation } from '../mutations'
import { useRoleOptionsQuery } from '../queries'
import { getUserDisplayName } from '../utils'

import type { User } from '@zen/shared'

type AssignUserRolesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

export function AssignUserRolesDialog({ open, onOpenChange, user }: AssignUserRolesDialogProps) {
  const { data, isLoading } = useRoleOptionsQuery(open)
  const { mutateAsync: assignRoles, isPending } = useAssignUserRolesMutation()
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!open) return
    setRoleIds(user.roles.map((role) => role.id))
    setPassword('')
  }, [open, user])

  const toggleRole = (roleId: string, checked: boolean) => {
    if (checked) {
      setRoleIds((prev) => [...prev, roleId])
      return
    }
    setRoleIds((prev) => prev.filter((id) => id !== roleId))
  }

  const handleSubmit = async () => {
    if (roleIds.length === 0) {
      toast.error('至少选择一个角色')
      return
    }
    try {
      const { stepUpToken } = await authApi.stepUp({ password })
      await assignRoles({ id: user.id, roleIds, stepUpToken })
      toast.success('角色已更新，目标用户需重新登录')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '分配角色失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分配角色</DialogTitle>
          <DialogDescription>
            为 {getUserDisplayName(user)} 覆盖式分配角色，需二次确认。
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ScrollArea className="h-56 rounded-md border p-3">
            <div className="flex flex-col gap-2">
              {(data?.items ?? []).map((role) => (
                <div key={role.id} className="flex items-start gap-2">
                  <Checkbox
                    id={`assign-role-${role.id}`}
                    checked={roleIds.includes(role.id)}
                    onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
                  />
                  <div className="grid gap-0.5 leading-none">
                    <Label htmlFor={`assign-role-${role.id}`}>{role.name}</Label>
                    <p className="font-mono text-xs text-muted-foreground">{role.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex flex-col gap-2">
          <Label>登录密码（二次确认）</Label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入当前登录密码"
          />
          <Alert>
            <AlertTitle>安全提示</AlertTitle>
            <AlertDescription>权限变更后目标用户现有会话将被强制下线。</AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Can permission={PermissionCode.ROLE_ASSIGN}>
            <Button
              type="button"
              disabled={isPending || !password || roleIds.length === 0}
              onClick={() => {
                void handleSubmit()
              }}
            >
              保存
            </Button>
          </Can>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
