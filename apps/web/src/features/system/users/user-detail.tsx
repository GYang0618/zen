import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@zen/ui'
import { ArrowLeft, Building2, Shield } from 'lucide-react'
import { useState } from 'react'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Can } from '@/components/auth/can'
import { Header, Main } from '@/components/layouts'
import { EmptyState, SystemPageHeader } from '@/features/system/components'

import { userApi } from './api'
import { AssignUserOrganizationsDialog } from './components/assign-user-organizations-dialog'
import { AssignUserRolesDialog } from './components/assign-user-roles-dialog'

import type { ReactNode } from 'react'

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN')
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 border-b border-border/60 py-2 text-sm last:border-b-0 sm:grid-cols-[9rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 wrap-break-word font-medium">{value ?? '—'}</dd>
    </div>
  )
}

export function UserDetail({ userId }: { userId: string }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['system', 'users', 'detail', userId],
    queryFn: () => userApi.getUser(userId),
    enabled: Boolean(userId)
  })
  const [rolesOpen, setRolesOpen] = useState(false)
  const [orgsOpen, setOrgsOpen] = useState(false)

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-3">
          <Button variant="ghost" size="sm" className="w-fit" asChild>
            <Link to="/system/users">
              <ArrowLeft data-icon="inline-start" />
              返回列表
            </Link>
          </Button>
          <SystemPageHeader
            title={data?.profile.nickname || data?.profile.username || '用户详情'}
            description="查看资料、角色、组织、安全与登录审计"
            actions={
              data ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={data.account.isLocked ? 'destructive' : 'secondary'}>
                    {data.account.isLocked ? '已锁定' : data.account.status}
                  </Badge>
                  <Can permission={PermissionCode.ROLE_ASSIGN}>
                    <Button size="sm" variant="outline" onClick={() => setRolesOpen(true)}>
                      <Shield data-icon="inline-start" />
                      分配角色
                    </Button>
                  </Can>
                  <Can permission={PermissionCode.ORG_UPDATE}>
                    <Button size="sm" variant="outline" onClick={() => setOrgsOpen(true)}>
                      <Building2 data-icon="inline-start" />
                      调整组织
                    </Button>
                  </Can>
                </div>
              ) : undefined
            }
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <Card>
            <EmptyState
              title="加载失败"
              description={error instanceof Error ? error.message : '未知错误'}
              action={
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  重试
                </Button>
              }
            />
          </Card>
        ) : data ? (
          <div className={`grid gap-4 lg:grid-cols-2 ${isFetching ? 'opacity-80' : ''}`}>
            <DetailSection title="基本资料">
              <dl>
                <DetailRow label="用户名" value={data.profile.username} />
                <DetailRow label="昵称" value={data.profile.nickname} />
                <DetailRow label="真实姓名" value={data.profile.realName} />
                <DetailRow label="邮箱" value={data.contact.email} />
                <DetailRow label="手机" value={data.contact.phoneNumber} />
                <DetailRow
                  label="状态"
                  value={
                    <Badge variant={data.account.isLocked ? 'destructive' : 'secondary'}>
                      {data.account.isLocked ? '已锁定' : data.account.status}
                    </Badge>
                  }
                />
                <DetailRow label="职位" value={data.org.jobTitle} />
                <DetailRow label="部门" value={data.org.deptName} />
                {data.remark ? <DetailRow label="备注" value={data.remark} /> : null}
              </dl>
            </DetailSection>

            <DetailSection title="角色">
              {(data.auth.roleDetails?.length ?? 0) === 0 && data.auth.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无角色</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {(data.auth.roleDetails.length > 0
                    ? data.auth.roleDetails
                    : data.auth.roles.map((code) => ({
                        id: code,
                        code,
                        name: code,
                        description: null as string | null,
                        status: 'active' as const
                      }))
                  ).map((role) => (
                    <li
                      key={role.id}
                      className="rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {role.name}
                        <Badge variant="outline">{role.code}</Badge>
                      </div>
                      {role.description ? (
                        <div className="mt-1 text-xs text-muted-foreground">{role.description}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>

            <DetailSection title="组织归属">
              {(data.organizations?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">暂无组织归属</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {data.organizations.map((org) => (
                    <li
                      key={org.organizationId}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {org.organizationName || org.organizationId}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {org.isPrimary ? (
                            <Badge variant="secondary">主职</Badge>
                          ) : (
                            <span>兼职</span>
                          )}
                          {org.postName ? <span>{org.postName}</span> : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>

            <DetailSection title="安全">
              <dl>
                <DetailRow
                  label="MFA"
                  value={
                    <Badge variant={data.security.mfaEnabled ? 'secondary' : 'outline'}>
                      {data.security.mfaEnabled ? '已启用' : '未启用'}
                    </Badge>
                  }
                />
                <DetailRow label="MFA 类型" value={data.security.mfaType} />
                <DetailRow label="密码过期" value={formatDate(data.security.passwordExpireAt)} />
                <DetailRow label="上次改密" value={formatDate(data.security.lastPasswordChange)} />
                <DetailRow label="登录尝试" value={data.security.loginAttempts ?? '—'} />
                {data.account.lockReason ? (
                  <DetailRow label="锁定原因" value={data.account.lockReason} />
                ) : null}
                {data.account.lockExpireAt ? (
                  <DetailRow label="锁定到期" value={formatDate(data.account.lockExpireAt)} />
                ) : null}
              </dl>
            </DetailSection>

            <DetailSection title="登录审计">
              <dl>
                <DetailRow label="最近登录" value={formatDate(data.audit.lastLoginAt)} />
                <DetailRow label="登录 IP" value={data.audit.lastLoginIp} />
                <DetailRow label="最近活跃" value={formatDate(data.audit.lastActiveAt)} />
                <DetailRow label="创建时间" value={formatDate(data.audit.createdAt)} />
                <DetailRow label="更新时间" value={formatDate(data.audit.updatedAt)} />
              </dl>
            </DetailSection>
          </div>
        ) : null}
      </Main>

      {data ? (
        <>
          <AssignUserRolesDialog open={rolesOpen} onOpenChange={setRolesOpen} user={data} />
          <AssignUserOrganizationsDialog open={orgsOpen} onOpenChange={setOrgsOpen} user={data} />
        </>
      ) : null}
    </>
  )
}
