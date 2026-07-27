import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@zen/ui'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  Clock,
  Copy,
  Globe,
  Info,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  UserX
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function CopyableText({ value, label }: { value: string | null | undefined; label?: string }) {
  const [copied, setCopied] = useState(false)

  if (!value) return <span className="text-muted-foreground">—</span>

  const handleCopy = () => {
    void navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success(`${label || '内容'}已复制`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group inline-flex items-center gap-1.5 font-medium text-foreground">
      <span className="truncate">{value}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-70 transition-all hover:bg-muted hover:text-foreground hover:opacity-100 group-hover:opacity-100"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              <span className="sr-only">复制{label}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{copied ? '已复制' : `复制 ${label || ''}`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

function InfoGridItem({
  label,
  value,
  icon: Icon
}: {
  label: string
  value: ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:border-border hover:bg-muted/20">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground break-all">{value ?? '—'}</div>
    </div>
  )
}

function StatusIndicator({ isLocked, status }: { isLocked: boolean; status: string }) {
  if (isLocked) {
    return (
      <Badge variant="destructive" className="gap-1.5 font-normal">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive-foreground opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-destructive-foreground" />
        </span>
        已锁定
      </Badge>
    )
  }

  const isNormal = status === 'normal' || status === 'active' || status === '正常'
  return (
    <Badge variant={isNormal ? 'secondary' : 'outline'} className="gap-1.5 font-normal">
      <span className={`size-2 rounded-full ${isNormal ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
      {status || '未知状态'}
    </Badge>
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

  const displayName = data?.profile.nickname || data?.profile.username || '用户详情'
  const initials = (displayName[0] || 'U').toUpperCase()

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
        {/* Navigation & Standard System Page Header */}
        <div className="flex flex-col gap-3">
          <Button variant="ghost" size="sm" className="w-fit -ms-2 gap-1 text-muted-foreground hover:text-foreground" asChild>
            <Link to="/system/users">
              <ArrowLeft className="size-4" />
              返回用户列表
            </Link>
          </Button>

          <SystemPageHeader
            title={displayName}
            description="查看与管理用户基本资料、角色权限、组织归属及安全审计"
            actions={
              data ? (
                <div className="flex flex-wrap items-center gap-2">
                  <StatusIndicator isLocked={data.account.isLocked} status={data.account.status} />
                  <Can permission={PermissionCode.ROLE_ASSIGN}>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRolesOpen(true)}>
                      <Shield className="size-4" />
                      分配角色
                    </Button>
                  </Can>
                  <Can permission={PermissionCode.ORG_UPDATE}>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOrgsOpen(true)}>
                      <Building2 className="size-4" />
                      调整组织
                    </Button>
                  </Can>
                </div>
              ) : undefined
            }
          />
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid gap-6 lg:grid-cols-3">
              <Skeleton className="h-80 w-full rounded-xl lg:col-span-1" />
              <Skeleton className="h-80 w-full rounded-xl lg:col-span-2" />
            </div>
          </div>
        ) : isError ? (
          <Card className="p-6">
            <EmptyState
              title="未能获取用户详情"
              description={error instanceof Error ? error.message : '请检查网络连接或重试'}
              action={
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  重试加载
                </Button>
              }
            />
          </Card>
        ) : data ? (
          <div className={`space-y-6 ${isFetching ? 'opacity-70 transition-opacity' : ''}`}>
            {/* User Profile Card (Integrated with Avatar & Key Quick Infos) */}
            <Card className="border-border/60 shadow-xs bg-card">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-16 border-2 border-background shadow-xs">
                      <AvatarImage src={data.profile.avatar ?? undefined} alt={displayName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight text-foreground">{displayName}</h2>
                        <span className="text-sm font-mono text-muted-foreground">@{data.profile.username}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
                        {(data.org.deptName || data.org.jobTitle) && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="size-3.5" />
                            <span>{[data.org.deptName, data.org.jobTitle].filter(Boolean).join(' · ')}</span>
                          </div>
                        )}
                        {data.contact.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="size-3.5" />
                            <span>{data.contact.email}</span>
                          </div>
                        )}
                        {data.contact.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <Phone className="size-3.5" />
                            <span>{data.contact.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Layout: Left Quick Sidebar + Right Tabs */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column: Quick Safety & Account Summary */}
              <div className="space-y-6 lg:col-span-1">
                {/* MFA & Security Quick Card */}
                <Card className="border-border/60 shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" />
                      安全概览
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <div className="font-medium">MFA 双因子认证</div>
                        <div className="text-xs text-muted-foreground">
                          {data.security.mfaType ? `认证方式: ${data.security.mfaType}` : '增强账号安全性'}
                        </div>
                      </div>
                      <Badge variant={data.security.mfaEnabled ? 'secondary' : 'outline'}>
                        {data.security.mfaEnabled ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Check className="size-3" /> 已启用
                          </span>
                        ) : (
                          '未启用'
                        )}
                      </Badge>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <KeyRound className="size-3.5" /> 上次改密
                        </span>
                        <span className="font-medium text-foreground">{formatDate(data.security.lastPasswordChange)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3.5" /> 最近活跃
                        </span>
                        <span className="font-medium text-foreground">{formatDate(data.audit.lastActiveAt)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Globe className="size-3.5" /> 登录 IP
                        </span>
                        <CopyableText value={data.audit.lastLoginIp} label="IP地址" />
                      </div>
                    </div>

                    {data.account.isLocked && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs space-y-1">
                        <div className="font-medium text-destructive flex items-center gap-1">
                          <ShieldAlert className="size-3.5" /> 账号已锁定
                        </div>
                        {data.account.lockReason && (
                          <p className="text-muted-foreground">原因: {data.account.lockReason}</p>
                        )}
                        {data.account.lockExpireAt && (
                          <p className="text-muted-foreground">解锁时间: {formatDate(data.account.lockExpireAt)}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Audit Meta Info */}
                <Card className="border-border/60 shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="size-4 text-primary" />
                      账号节点信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">创建时间</span>
                      <span className="font-medium text-foreground">{formatDate(data.audit.createdAt)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">最近更新</span>
                      <span className="font-medium text-foreground">{formatDate(data.audit.updatedAt)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">登录重试次数</span>
                      <span className="font-medium text-foreground">{data.security.loginAttempts ?? 0} 次</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Detailed Tabs */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList variant="line" className="w-full justify-start border-b rounded-none p-0 h-10 gap-6">
                    <TabsTrigger value="profile" className="gap-2 px-1">
                      <User className="size-4" />
                      基本资料
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="gap-2 px-1">
                      <Shield className="size-4" />
                      角色权限
                      <Badge variant="secondary" className="ms-1 size-5 p-0 justify-center rounded-full text-xs">
                        {data.auth.roleDetails?.length || data.auth.roles?.length || 0}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="orgs" className="gap-2 px-1">
                      <Building2 className="size-4" />
                      组织归属
                      <Badge variant="secondary" className="ms-1 size-5 p-0 justify-center rounded-full text-xs">
                        {data.organizations?.length || 0}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2 px-1">
                      <Lock className="size-4" />
                      安全与审计
                    </TabsTrigger>
                  </TabsList>


                  {/* Tab 1: Profile Details */}
                  <TabsContent value="profile" className="mt-4 space-y-4">
                    <Card className="border-border/60 shadow-xs">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">个人档案</CardTitle>
                        <CardDescription>包含基本身份与联系方式信息</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InfoGridItem label="用户名" value={<CopyableText value={data.profile.username} label="用户名" />} icon={User} />
                          <InfoGridItem label="昵称" value={data.profile.nickname} icon={UserCheck} />
                          <InfoGridItem label="真实姓名" value={data.profile.realName} icon={User} />
                          <InfoGridItem label="部门" value={data.org.deptName} icon={Building2} />
                          <InfoGridItem label="职位" value={data.org.jobTitle} icon={Briefcase} />
                          <InfoGridItem label="电子邮箱" value={<CopyableText value={data.contact.email} label="邮箱" />} icon={Mail} />
                          <InfoGridItem label="手机号码" value={<CopyableText value={data.contact.phoneNumber} label="手机号" />} icon={Phone} />
                          <InfoGridItem label="账号状态" value={<StatusIndicator isLocked={data.account.isLocked} status={data.account.status} />} icon={UserX} />
                        </div>
                        {data.remark && (
                          <div className="mt-4 rounded-lg border border-border/50 bg-muted/20 p-3 text-xs">
                            <span className="font-medium text-muted-foreground">备注信息：</span>
                            <p className="mt-1 text-foreground">{data.remark}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab 2: Roles */}
                  <TabsContent value="roles" className="mt-4 space-y-4">
                    <Card className="border-border/60 shadow-xs">
                      <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                          <CardTitle className="text-base">关联角色</CardTitle>
                          <CardDescription>控制该用户在系统内的访问权限与模块访问度</CardDescription>
                        </div>
                        <Can permission={PermissionCode.ROLE_ASSIGN}>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => setRolesOpen(true)}>
                            <Shield className="size-3.5" />
                            修改角色
                          </Button>
                        </Can>
                      </CardHeader>
                      <CardContent>
                        {(data.auth.roleDetails?.length ?? 0) === 0 && data.auth.roles.length === 0 ? (
                          <div className="py-8 text-center border rounded-lg border-dashed">
                            <p className="text-sm text-muted-foreground">暂无角色权限</p>
                            <Can permission={PermissionCode.ROLE_ASSIGN}>
                              <Button size="sm" variant="link" className="mt-2" onClick={() => setRolesOpen(true)}>
                                为该用户分配角色
                              </Button>
                            </Can>
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
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
                              <div
                                key={role.id}
                                className="flex flex-col justify-between gap-2 rounded-xl border border-border/60 bg-card p-4 transition-all hover:shadow-xs hover:border-border"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-sm text-foreground">{role.name}</span>
                                    <Badge variant="outline" className="font-mono text-[10px]">
                                      {role.code}
                                    </Badge>
                                  </div>
                                  {role.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab 3: Organizations */}
                  <TabsContent value="orgs" className="mt-4 space-y-4">
                    <Card className="border-border/60 shadow-xs">
                      <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                          <CardTitle className="text-base">所属组织架构</CardTitle>
                          <CardDescription>查看主职与兼职的部门、岗位分配</CardDescription>
                        </div>
                        <Can permission={PermissionCode.ORG_UPDATE}>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => setOrgsOpen(true)}>
                            <Building2 className="size-3.5" />
                            调整组织
                          </Button>
                        </Can>
                      </CardHeader>
                      <CardContent>
                        {(data.organizations?.length ?? 0) === 0 ? (
                          <div className="py-8 text-center border rounded-lg border-dashed">
                            <p className="text-sm text-muted-foreground">暂无组织归属信息</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {data.organizations.map((org) => (
                              <div
                                key={org.organizationId}
                                className="flex items-center justify-between rounded-lg border border-border/60 p-3.5 transition-colors hover:bg-muted/20"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Building2 className="size-4" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm text-foreground">
                                      {org.organizationName || org.organizationId}
                                    </div>
                                    {org.postName && (
                                      <div className="text-xs text-muted-foreground">岗位: {org.postName}</div>
                                    )}
                                  </div>
                                </div>
                                <Badge variant={org.isPrimary ? 'default' : 'secondary'}>
                                  {org.isPrimary ? '主职部门' : '兼职'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab 4: Security & Audit */}
                  <TabsContent value="security" className="mt-4 space-y-4">
                    <Card className="border-border/60 shadow-xs">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">安全与锁定参数</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InfoGridItem
                            label="MFA 状态"
                            value={
                              <Badge
                                variant={data.security.mfaEnabled ? 'secondary' : 'outline'}
                                className={
                                  data.security.mfaEnabled
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : undefined
                                }
                              >
                                {data.security.mfaEnabled ? '已启用' : '未启用'}
                              </Badge>
                            }
                            icon={ShieldCheck}
                          />
                          <InfoGridItem label="MFA 认证类型" value={data.security.mfaType} icon={KeyRound} />
                          <InfoGridItem label="密码过期时间" value={formatDate(data.security.passwordExpireAt)} icon={Clock} />
                          <InfoGridItem label="上次修改密码" value={formatDate(data.security.lastPasswordChange)} icon={Clock} />
                          <InfoGridItem label="登录失败尝试数" value={`${data.security.loginAttempts ?? 0} 次`} icon={ShieldAlert} />
                          <InfoGridItem
                            label="账号锁定状态"
                            value={data.account.isLocked ? <span className="text-destructive font-medium">已锁定</span> : '正常未锁定'}
                            icon={Lock}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">访问与审计轨迹</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InfoGridItem label="最近登录时间" value={formatDate(data.audit.lastLoginAt)} icon={Clock} />
                          <InfoGridItem label="最近登录 IP" value={<CopyableText value={data.audit.lastLoginIp} label="登录IP" />} icon={Globe} />
                          <InfoGridItem label="最近活跃时间" value={formatDate(data.audit.lastActiveAt)} icon={Clock} />
                          <InfoGridItem label="账号创建时间" value={formatDate(data.audit.createdAt)} icon={Clock} />
                          <InfoGridItem label="信息更新时间" value={formatDate(data.audit.updatedAt)} icon={Clock} />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
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


