import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  ScrollArea,
  toast
} from '@zen/ui'
import { Check, Info, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useRolesQuery } from '@/features/system/roles/queries'

import { useUpdatePositionRoles } from '../queries'

import type { Position } from '../type'

interface OrganizationPositionRolesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  position: Position | null
}

export function OrganizationPositionRolesDialog({
  open,
  onOpenChange,
  organizationId,
  position
}: OrganizationPositionRolesDialogProps) {
  const [keyword, setKeyword] = useState('')
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  const { data: rolesData, isLoading: isRolesLoading } = useRolesQuery(
    { page: 1, pageSize: 100 },
    { enabled: open }
  )

  const updatePositionRoles = useUpdatePositionRoles(organizationId)

  // 当打开弹窗时，将岗位当前的 roles.id 初始化到 selectedRoleIds
  useEffect(() => {
    if (open && position) {
      setSelectedRoleIds((position.roles ?? []).map((r) => r.id))
      setKeyword('')
    }
  }, [open, position])

  const roles = useMemo(() => rolesData?.items ?? [], [rolesData?.items])

  const filteredRoles = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return roles
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.description?.toLowerCase().includes(q) ?? false)
    )
  }, [keyword, roles])

  const handleToggle = (roleId: string, checked: boolean) => {
    setSelectedRoleIds((prev) => (checked ? [...prev, roleId] : prev.filter((id) => id !== roleId)))
  }

  const handleSave = async () => {
    if (!position) return

    try {
      await updatePositionRoles.mutateAsync({
        positionId: position.id,
        data: {
          roleIds: selectedRoleIds
        }
      })
      toast.add({ title: `成功更新「${position.name}」的基准角色配置`, type: 'success' })
      onOpenChange(false)
    } catch (err) {
      toast.add({
        title: err instanceof Error ? err.message : '更新岗位基准角色失败',
        type: 'error'
      })
    }
  }

  if (!position) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <DialogTitle>配置岗位基准角色</DialogTitle>
              <DialogDescription>
                岗位「{position.name}」的任职人员将自动继承所选角色的功能与数据权限
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <InputGroup className="w-full">
            <InputGroupInput
              placeholder="搜索角色名称、编码或描述"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>

          <Alert className="border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 py-2 text-xs">
            <Info className="size-3.5" />
            <AlertDescription>
              基于 PBAC (Position-Based Access Control)
              原则：员工入职定岗自动获得权限，轮岗或调离时自动解除，无需手动逐个配置用户角色。
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border">
            <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span>可用角色列表</span>
              <span>已选 {selectedRoleIds.length} 项</span>
            </div>

            <ScrollArea className="max-h-64">
              {isRolesLoading ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  正在加载系统角色…
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  未找到匹配的角色
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredRoles.map((role) => {
                    const isChecked = selectedRoleIds.includes(role.id)
                    const roleInputId = `pos-role-${role.id}`
                    return (
                      <div
                        key={role.id}
                        className="flex items-start gap-3 p-3 transition-colors hover:bg-muted/40"
                      >
                        <Checkbox
                          id={roleInputId}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleToggle(role.id, !!checked)}
                          className="mt-0.5"
                          aria-label={`选择角色${role.name}`}
                        />
                        <label htmlFor={roleInputId} className="flex-1 min-w-0 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{role.name}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {role.code}
                            </Badge>
                            {role.kind === 'system' ? (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                系统
                              </Badge>
                            ) : null}
                          </div>
                          {role.description ? (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {role.description}
                            </p>
                          ) : null}
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updatePositionRoles.isPending}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={updatePositionRoles.isPending}
          >
            <Check className="size-4" />
            {updatePositionRoles.isPending ? '保存中…' : '保存基准角色'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
