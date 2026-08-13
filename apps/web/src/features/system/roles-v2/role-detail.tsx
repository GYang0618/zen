import { useNavigate, useParams } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  cn,
  Label,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderMedia,
  PageHeaderTitle,
  Separator,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import {
  ArrowLeft,
  CalendarClock,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  Radar,
  Save,
  Shield,
  Users
} from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { AppHeader, Main } from '@/components/layouts'
import { authApi } from '@/features/auth/api'
import { useAuditList } from '@/features/system/audit/queries'
import {
  useAssignRoleDataScopeMutation,
  useAssignRolePermissionsMutation,
  useUpdateRoleMutation
} from '@/features/system/roles-v2/mutations'
import { usePermissionsQuery, useRoleQuery } from '@/features/system/roles-v2/queries'
import { useAuthStore } from '@/stores'

import { PermissionMatrix } from './components/permission-matrix'
import { RoleActionDialog } from './components/role-action-dialog'
import { RoleAuditTimelineCard } from './components/role-audit-timeline-card'
import { RoleBasicInfoCard } from './components/role-basic-info-card'
import { RoleCloneDialog } from './components/role-clone-dialog'
import { RoleMembers } from './components/role-members'
import { RoleRelatedMembersCard } from './components/role-related-members-card'
import { RoleScope } from './components/role-scope'
import { dataScopeConfig, getRoleIconColorClassName, roleEffectiveStatusConfig } from './data/data'

import type { Role, RoleDataScope, RoleIcon } from '@zen/shared'
import type { RoleAuditTimelineItem } from './components/role-audit-timeline-card'
import type { RoleBasicInfoItem } from './components/role-basic-info-card'
import type { RoleMemberPreview } from './components/role-related-members-card'

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((item, index) => sortedA[index] === sortedB[index])
}

function formatExpiresAt(value: string | null) {
  if (!value) return '无限制'
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(value.length === 10 ? `${value}T00:00:00` : value))
  } catch {
    return value
  }
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function summarizeDiff(diff: unknown): string {
  if (diff == null) return '无详细变更内容'
  if (typeof diff === 'string') return diff
  try {
    return JSON.stringify(diff).slice(0, 180)
  } catch {
    return '无法解析变更详情'
  }
}

async function silentRefreshAuthSession() {
  try {
    const session = await authApi.refresh()
    useAuthStore.getState().setAuth(session)
  } catch {
    // 由请求中间件在后续 401 时再尝试；此处不打断保存成功提示
  }
}

function RoleDetailContent({ role }: { role: Role }) {
  const navigate = useNavigate()
  const locked = role.code === 'super_admin' || role.kind === 'system'
  const matrixLocked = role.code === 'super_admin'

  const { data: groups = [], isLoading: permissionsLoading } = usePermissionsQuery(true)
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRoleMutation()
  const { mutate: assignPermissions, isPending: isAssigningPermissions } =
    useAssignRolePermissionsMutation()
  const { mutate: assignDataScope, isPending: isAssigningScope } = useAssignRoleDataScopeMutation()
  const isSaving = isUpdating || isAssigningPermissions || isAssigningScope

  const [draftPermissions, setDraftPermissions] = useState(role.permissions)
  const [draftScope, setDraftScope] = useState<RoleDataScope>(role.dataScope)
  const [draftCustomOrgIds, setDraftCustomOrgIds] = useState(role.customOrgIds ?? [])
  const [editOpen, setEditOpen] = useState(false)
  const [cloneOpen, setCloneOpen] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset drafts only when switching role
  useEffect(() => {
    setDraftPermissions(role.permissions)
    setDraftScope(role.dataScope)
    setDraftCustomOrgIds(role.customOrgIds ?? [])
    setEditOpen(false)
    setCloneOpen(false)
  }, [role.id])

  const permissionsDirty = !arraysEqual(draftPermissions, role.permissions)
  const scopeDirty =
    draftScope !== role.dataScope ||
    (draftScope === 'custom' && !arraysEqual(draftCustomOrgIds, role.customOrgIds ?? []))
  const isDirty = permissionsDirty || scopeDirty

  const { data: auditData } = useAuditList({
    keyword: role.id,
    page: 1,
    pageSize: 8
  })

  const auditItems: RoleAuditTimelineItem[] = useMemo(
    () =>
      (auditData?.items ?? []).map((log) => ({
        title: log.actorId ? `操作者 ${log.actorId.slice(0, 8)}…` : '系统',
        timestamp: formatRelativeTime(log.createdAt),
        description: `${log.action}${log.resource ? ` · ${log.resource}` : ''} — ${summarizeDiff(log.diff)}`
      })),
    [auditData?.items]
  )

  const memberPreviews: RoleMemberPreview[] = useMemo(
    () =>
      role.memberPreview.map((member) => {
        const name = member.nickname ?? '成员'
        return {
          id: member.id,
          name,
          avatarUrl: member.avatar ?? '',
          fallback: name.slice(0, 1).toUpperCase()
        }
      }),
    [role.memberPreview]
  )

  const basicInfoItems: RoleBasicInfoItem[] = [
    {
      icon: <CalendarClock size={14} />,
      label: '有效期至',
      value: formatExpiresAt(role.expiresAt)
    },
    {
      icon: <Radar size={14} />,
      label: '数据范围',
      value: (
        <Badge variant="secondary">
          {dataScopeConfig[role.dataScope]?.label ?? role.dataScope}
        </Badge>
      )
    },
    {
      icon: <KeyRound size={14} />,
      label: '权限数量',
      value: `${role.permissionCount} 项`
    },
    {
      icon: <Users size={14} />,
      label: '成员数量',
      value: `${role.memberCount} 人`
    }
  ]

  const statusConfig = roleEffectiveStatusConfig[role.effectiveStatus]

  const handleStatusToggle = (checked: boolean) => {
    if (locked) {
      toast.error('系统角色状态不可修改')
      return
    }
    updateRole(
      { id: role.id, data: { status: checked ? 'active' : 'disabled' } },
      {
        onSuccess: () => toast.success(checked ? '角色已激活' : '角色已冻结')
      }
    )
  }

  const handleSave = () => {
    if (matrixLocked && permissionsDirty) {
      toast.error('超级管理员角色权限矩阵不可修改')
      return
    }
    if (locked && scopeDirty) {
      toast.error('系统角色数据范围不可修改')
      return
    }
    if (draftScope === 'custom' && draftCustomOrgIds.length === 0) {
      toast.error('自定义数据范围时至少选择一个组织')
      return
    }

    const baseVersion = role.updatedAt
    const tasks: Promise<unknown>[] = []

    if (permissionsDirty && !matrixLocked) {
      tasks.push(
        new Promise((resolve, reject) => {
          assignPermissions(
            {
              id: role.id,
              data: { permissionCodes: draftPermissions, baseVersion }
            },
            { onSuccess: resolve, onError: reject }
          )
        })
      )
    }

    if (scopeDirty && !locked) {
      tasks.push(
        new Promise((resolve, reject) => {
          assignDataScope(
            {
              id: role.id,
              data: {
                dataScope: draftScope,
                customOrgIds: draftScope === 'custom' ? draftCustomOrgIds : [],
                baseVersion
              }
            },
            { onSuccess: resolve, onError: reject }
          )
        })
      )
    }

    if (tasks.length === 0) {
      toast.message('没有需要保存的变更')
      return
    }

    Promise.all(tasks)
      .then(async () => {
        await silentRefreshAuthSession()
        toast.success('角色配置已保存')
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : '保存失败'
        if (message.includes('冲突') || message.includes('409') || message.includes('版本')) {
          toast.error('配置已被他人更新，请刷新后重试')
          return
        }
        toast.error(message)
      })
  }

  return (
    <>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <PageHeader size="lg">
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            onClick={() => navigate({ to: '/system/roles' })}
          >
            <ArrowLeft />
          </Button>
          <PageHeaderMedia className={cn(getRoleIconColorClassName(role.iconColor))}>
            <DynamicIcon name={(role.icon as RoleIcon | null) ?? 'shield'} />
          </PageHeaderMedia>
          <PageHeaderContent>
            <PageHeaderTitle as="h1" className="text-4xl">
              {role.name}
            </PageHeaderTitle>
            <PageHeaderDescription className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary" className={cn('border', statusConfig.className)}>
                {statusConfig.label}
              </Badge>
              <span>•</span>
              <span className="font-mono">{role.code}</span>
            </PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions className="gap-3">
            <Can permission={PermissionCode.ROLE_UPDATE}>
              <div className="flex items-center gap-3 rounded-full border px-3 py-2">
                <Switch
                  id="role-active"
                  checked={role.status === 'active'}
                  disabled={locked || isUpdating}
                  onCheckedChange={handleStatusToggle}
                />
                <Label htmlFor="role-active">激活</Label>
              </div>
            </Can>
            <Separator orientation="vertical" className="h-8 data-vertical:self-center" />
            <Can permission={PermissionCode.ROLE_UPDATE}>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil /> 编辑
              </Button>
            </Can>
            <Can permission={PermissionCode.ROLE_CREATE}>
              {!role.isSystem ? (
                <Button variant="outline" onClick={() => setCloneOpen(true)}>
                  <Copy /> 克隆
                </Button>
              ) : null}
            </Can>
            <Can permission={[PermissionCode.ROLE_UPDATE, PermissionCode.ROLE_ASSIGN]} mode="any">
              {isDirty ? (
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                  保存变更
                </Button>
              ) : null}
            </Can>
          </PageHeaderActions>
        </PageHeader>

        <Tabs defaultValue="permissions" className="w-full">
          <TabsList variant="line" className="mb-4 group-data-horizontal/tabs:h-12">
            <TabsTrigger value="permissions">
              <KeyRound className="size-3.5" aria-hidden />
              权限矩阵 ({draftPermissions.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="size-3.5" aria-hidden />
              关联用户 ({role.memberCount})
            </TabsTrigger>
            <TabsTrigger value="scope">
              <Shield className="size-3.5" aria-hidden />
              数据边界
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-6 @5xl/content:flex-row">
            <div className="min-w-0 flex-1">
              <TabsContent value="permissions">
                <PermissionMatrix
                  groups={groups}
                  value={draftPermissions}
                  onChange={setDraftPermissions}
                  disabled={matrixLocked}
                  isLoading={permissionsLoading}
                />
              </TabsContent>
              <TabsContent value="users">
                <RoleMembers roleId={role.id} roleName={role.name} memberCount={role.memberCount} />
              </TabsContent>
              <TabsContent value="scope">
                <RoleScope
                  value={draftScope}
                  customOrgIds={draftCustomOrgIds}
                  disabled={locked}
                  onScopeChange={setDraftScope}
                  onCustomOrgIdsChange={setDraftCustomOrgIds}
                />
              </TabsContent>
            </div>

            <div className="bg-muted/35 flex w-full shrink-0 flex-col gap-4 rounded-[28px] border border-dashed p-3 @5xl/content:w-90 @5xl/content:self-start">
              <RoleBasicInfoCard items={basicInfoItems} />
              <RoleRelatedMembersCard members={memberPreviews} totalCount={role.memberCount} />
              <RoleAuditTimelineCard data={auditItems} />
            </div>
          </div>
        </Tabs>
      </Main>

      <RoleActionDialog currentRow={role} open={editOpen} onOpenChange={setEditOpen} />
      {!role.isSystem ? (
        <RoleCloneDialog currentRow={role} open={cloneOpen} onOpenChange={setCloneOpen} />
      ) : null}
    </>
  )
}

export function RoleDetail() {
  const params = useParams({ strict: false }) as { id?: string }
  const id = params.id ?? ''
  const { data: role, isLoading, isError } = useRoleQuery(id || null)

  if (isLoading) {
    return (
      <>
        <AppHeader />
        <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </Main>
      </>
    )
  }

  if (isError || !role) {
    return (
      <>
        <AppHeader />
        <Main className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive">角色不存在或加载失败</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            返回
          </Button>
        </Main>
      </>
    )
  }

  return <RoleDetailContent role={role} />
}
