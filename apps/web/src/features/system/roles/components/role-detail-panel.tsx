import { PermissionCode } from '@zen/shared'
import { Badge, Button, cn, Tabs, TabsContent, TabsList, TabsTrigger } from '@zen/ui'
import {
  Check,
  Copy,
  History,
  KeyRound,
  PauseCircle,
  Pencil,
  PlayCircle,
  Shield,
  ShieldAlert,
  Trash2,
  Users
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { getConfig } from '@/lib/config-utils'

import { roleStatusConfig } from '../data/data'
import { useUpdateRoleMutation } from '../mutations'
import { usePermissionsQuery } from '../queries'
import { PermissionMatrix } from './permission-matrix'
import { RoleAuditTab } from './role-audit-tab'
import { RoleCloneDialog } from './role-clone-dialog'
import { RoleDiffDialog } from './role-diff-dialog'
import { RoleEditDialog } from './role-edit-dialog'
import { RoleMembersTab } from './role-members-tab'
import { RoleScopeTab } from './role-scope-tab'

import type { Role, RoleDataScope } from '@zen/shared'

type RoleDetailPanelProps = {
  role: Role
  onDelete: (role: Role) => void
  onRoleCreated?: (roleId: string) => void
  onDirtyChange?: (dirty: boolean) => void
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((item, index) => item === sortedB[index])
}

export function RoleDetailPanel({
  role,
  onDelete,
  onRoleCreated,
  onDirtyChange
}: RoleDetailPanelProps) {
  const locked = role.code === 'super_admin'
  const { data: groups = [], isLoading: permissionsLoading } = usePermissionsQuery(true)
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRoleMutation()

  const [draftPermissions, setDraftPermissions] = useState(role.permissions)
  const [draftScope, setDraftScope] = useState<RoleDataScope>(role.dataScope)
  const [draftCustomOrgIds, setDraftCustomOrgIds] = useState(role.customOrgIds ?? [])
  const [tab, setTab] = useState('permissions')
  const [editOpen, setEditOpen] = useState(false)
  const [cloneOpen, setCloneOpen] = useState(false)
  const [diffOpen, setDiffOpen] = useState(false)

  // 仅切换角色时重置；成员绑定等刷新 role 对象时不能把当前 Tab 打回第一个
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed by role.id only
  useEffect(() => {
    setDraftPermissions(role.permissions)
    setDraftScope(role.dataScope)
    setDraftCustomOrgIds(role.customOrgIds ?? [])
    setTab('permissions')
    setDiffOpen(false)
    setEditOpen(false)
    setCloneOpen(false)
  }, [role.id])

  const permissionsDirty = !arraysEqual(draftPermissions, role.permissions)
  const scopeDirty =
    draftScope !== role.dataScope ||
    (draftScope === 'custom' && !arraysEqual(draftCustomOrgIds, role.customOrgIds ?? []))
  const isDirty = permissionsDirty || scopeDirty

  useEffect(() => {
    onDirtyChange?.(isDirty)
    return () => onDirtyChange?.(false)
  }, [isDirty, onDirtyChange])

  const diff = useMemo(() => {
    const added = draftPermissions.filter((code) => !role.permissions.includes(code))
    const removed = role.permissions.filter((code) => !draftPermissions.includes(code))
    return { added, removed, scopeChanged: scopeDirty }
  }, [draftPermissions, role.permissions, scopeDirty])

  const handleResetChanges = () => {
    setDraftPermissions(role.permissions)
    setDraftScope(role.dataScope)
    setDraftCustomOrgIds(role.customOrgIds ?? [])
    toast.message('已重置为改动前的初始配置')
  }

  const handleCommitSave = () => {
    if (locked) {
      toast.error('超级管理员角色不可编辑')
      return
    }

    if (draftScope === 'custom' && draftCustomOrgIds.length === 0) {
      toast.error('自定义数据范围时至少选择一个组织')
      setTab('scope')
      setDiffOpen(false)
      return
    }

    updateRole(
      {
        id: role.id,
        data: {
          permissionCodes: draftPermissions,
          dataScope: draftScope,
          customOrgIds: draftScope === 'custom' ? draftCustomOrgIds : []
        }
      },
      {
        onSuccess: () => {
          toast.success(`已成功保存对角色「${role.name}」的配置修改`)
          setDiffOpen(false)
        }
      }
    )
  }

  const handleToggleStatus = () => {
    if (locked || role.isSystem) {
      toast.error('系统内置角色状态不可修改')
      return
    }

    const nextStatus = role.status === 'active' ? 'disabled' : 'active'
    updateRole(
      {
        id: role.id,
        data: { status: nextStatus }
      },
      {
        onSuccess: () => {
          toast.success(
            nextStatus === 'active'
              ? `已恢复启用角色「${role.name}」`
              : `已成功冻结角色「${role.name}」`
          )
        }
      }
    )
  }

  const status = getConfig(roleStatusConfig, role.status)

  return (
    <section className="relative flex min-h-128 min-w-0 flex-col overflow-hidden rounded-xl border bg-card lg:min-h-[calc(100svh-12rem)]">
      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 border-b px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-xl font-bold tracking-tight">{role.name}</h1>
                <span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  {role.code}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    status.color
                  )}
                >
                  {status.label}
                </span>
                {role.isSystem ? <Badge variant="secondary">受保护系统角色</Badge> : null}
              </div>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                {role.description || '暂无角色描述'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Can permission={PermissionCode.ROLE_UPDATE}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={locked || role.isSystem || isUpdating}
                  className={
                    role.status === 'active'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400'
                  }
                  onClick={handleToggleStatus}
                  title={
                    role.status === 'active'
                      ? '冻结后将临时暂停该角色的所有生效权限'
                      : '恢复启用角色'
                  }
                >
                  {role.status === 'active' ? (
                    <PauseCircle data-icon="inline-start" />
                  ) : (
                    <PlayCircle data-icon="inline-start" />
                  )}
                  {role.status === 'active' ? '冻结角色' : '解冻启用'}
                </Button>
              </Can>

              <Can permission={PermissionCode.ROLE_UPDATE}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={locked}
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil data-icon="inline-start" />
                  编辑信息
                </Button>
              </Can>

              <Can permission={PermissionCode.ROLE_CREATE}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCloneOpen(true)}
                >
                  <Copy data-icon="inline-start" />
                  克隆策略
                </Button>
              </Can>

              <Can permission={PermissionCode.ROLE_DELETE}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
                  disabled={role.isSystem}
                  onClick={() => onDelete(role)}
                >
                  <Trash2 data-icon="inline-start" />
                  删除角色
                </Button>
              </Can>
            </div>
          </div>

          <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList
              variant="line"
              className="mt-4 h-auto w-max min-w-full justify-start gap-4 rounded-none border-b bg-transparent p-0 sm:mt-6 sm:gap-6"
            >
              <TabsTrigger
                value="permissions"
                className="flex-none shrink-0 gap-2 rounded-none px-0 pb-3"
              >
                <KeyRound className="size-3.5" aria-hidden />
                <span className="whitespace-nowrap">权限功能矩阵</span>
                <Badge variant="secondary" className="ms-1 text-[10px]">
                  {draftPermissions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="flex-none shrink-0 gap-2 rounded-none px-0 pb-3"
              >
                <Users className="size-3.5" aria-hidden />
                <span className="whitespace-nowrap">关联用户 ({role.memberCount})</span>
              </TabsTrigger>
              <TabsTrigger
                value="scope"
                className="flex-none shrink-0 gap-2 rounded-none px-0 pb-3"
              >
                <Shield className="size-3.5" aria-hidden />
                <span className="whitespace-nowrap">数据边界</span>
                {scopeDirty ? (
                  <span title="有未保存修改" className="ms-1 size-1.5 rounded-full bg-primary" />
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="flex-none shrink-0 gap-2 rounded-none px-0 pb-3"
              >
                <History className="size-3.5" aria-hidden />
                <span className="whitespace-nowrap">审计日志</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent
          value="permissions"
          className="relative mt-0 min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-5 sm:py-5"
        >
          {locked ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-foreground" aria-hidden />
              <span>超级管理员默认拥有全部权限，配置不可修改。</span>
            </div>
          ) : null}

          <PermissionMatrix
            groups={groups}
            value={
              locked
                ? groups.flatMap((group) => group.permissions.map((item) => item.code))
                : draftPermissions
            }
            onChange={setDraftPermissions}
            disabled={locked}
            isLoading={permissionsLoading}
          />
        </TabsContent>

        <TabsContent
          value="users"
          className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5"
        >
          <RoleMembersTab roleId={role.id} roleName={role.name} memberCount={role.memberCount} />
        </TabsContent>

        <TabsContent
          value="scope"
          className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5"
        >
          <RoleScopeTab
            value={draftScope}
            customOrgIds={draftCustomOrgIds}
            disabled={locked}
            onScopeChange={setDraftScope}
            onCustomOrgIdsChange={setDraftCustomOrgIds}
          />
        </TabsContent>

        <TabsContent
          value="audit"
          className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5"
        >
          <RoleAuditTab roleId={role.id} roleName={role.name} />
        </TabsContent>
      </Tabs>

      {isDirty && !locked ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed bottom-6 left-1/2 z-50 -translate-x-1/2',
            'transition-all delay-100 duration-300 ease-out'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-x-3 rounded-xl border p-2 shadow-xl',
              'bg-background/95 backdrop-blur-lg supports-backdrop-filter:bg-background/60'
            )}
          >
            <div className="flex items-center gap-2 px-2 text-sm">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-amber-400" />
              </span>
              <span className="font-medium">检测到配置修改未保存</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleResetChanges}>
                重置修改
              </Button>
              <Can permission={PermissionCode.ROLE_UPDATE}>
                <Button type="button" size="sm" onClick={() => setDiffOpen(true)}>
                  <Check data-icon="inline-start" />
                  查看 Diff 并保存
                </Button>
              </Can>
            </div>
          </div>
        </div>
      ) : null}

      <RoleEditDialog open={editOpen} onOpenChange={setEditOpen} role={role} />

      <RoleCloneDialog
        open={cloneOpen}
        onOpenChange={setCloneOpen}
        role={role}
        onCloned={onRoleCreated}
      />

      <RoleDiffDialog
        open={diffOpen}
        onOpenChange={setDiffOpen}
        roleName={role.name}
        added={diff.added}
        removed={diff.removed}
        scopeChanged={diff.scopeChanged}
        fromScope={role.dataScope}
        toScope={draftScope}
        groups={groups}
        isSaving={isUpdating}
        onConfirm={handleCommitSave}
      />
    </section>
  )
}
