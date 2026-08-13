import { Link } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderMedia,
  PageHeaderTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import { ArrowLeft, Building2, KeyRound, LockOpen, Pencil, Shield, UserRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { EmptyState } from '@/components/empty-state'
import { AppHeader, Main } from '@/components/layouts'

import { AssignUserOrganizationsDialog } from './components/assign-user-organizations-dialog'
import { AssignUserRolesDialog } from './components/assign-user-roles-dialog'
import { UserActionSheet } from './components/user-action-sheet'
import { UserDetailSideOverview } from './components/user-detail-side-overview'
import { UserOrganizationsCard } from './components/user-organizations-card'
import { UserRolesCard } from './components/user-roles-card'
import { UserSecurityCard } from './components/user-security-card'
import { UsersResetPasswordDialog } from './components/users-reset-password-dialog'
import { statusConfig } from './data/data'
import { useUnlockUserMutation } from './mutations'
import { useUserQuery } from './queries'
import { getUserDisplayName } from './utils'

import type { User } from '@zen/shared'

export function UserDetail({ userId }: { userId: string }) {
  const { data, isLoading, isError, error, refetch } = useUserQuery(userId)

  if (isLoading) {
    return (
      <>
        <AppHeader />
        <Main className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </Main>
      </>
    )
  }

  if (isError || !data) {
    return (
      <>
        <AppHeader />
        <Main className="flex flex-1 flex-col gap-4">
          <EmptyState
            title="未能获取用户详情"
            description={error instanceof Error ? error.message : '用户不存在或无权访问'}
            action={
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link to="/system/users">返回用户列表</Link>
                </Button>
                <Button variant="outline" onClick={() => refetch()}>
                  重试
                </Button>
              </div>
            }
          />
        </Main>
      </>
    )
  }

  return <UserDetailContent user={data} />
}

function UserDetailContent({ user }: { user: User }) {
  const [editOpen, setEditOpen] = useState(false)
  const [rolesOpen, setRolesOpen] = useState(false)
  const [orgsOpen, setOrgsOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const { mutate: unlockUser, isPending: isUnlocking } = useUnlockUserMutation()
  const status = statusConfig[user.status]
  const displayName = getUserDisplayName(user)

  return (
    <>
      <AppHeader />
      <Main className="flex flex-1 flex-col gap-4">
        <PageHeader size="lg">
          <Button variant="outline" size="icon-lg" className="rounded-full" asChild>
            <Link to="/system/users" aria-label="返回用户管理">
              <ArrowLeft />
            </Link>
          </Button>
          <PageHeaderMedia>
            <UserRound />
          </PageHeaderMedia>
          <PageHeaderContent>
            <PageHeaderTitle as="h1" className="inline-flex flex-wrap items-center gap-3">
              {displayName}
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
              {user.isLocked ? <Badge variant="destructive">已锁定</Badge> : null}
            </PageHeaderTitle>
            <PageHeaderDescription className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono">@{user.username}</span>
              <span>•</span>
              <span>{user.email}</span>
            </PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions className="gap-3">
            <Can permission={PermissionCode.USER_UPDATE}>
              {user.isLocked ? (
                <Button
                  variant="outline"
                  disabled={isUnlocking}
                  onClick={() =>
                    unlockUser(user.id, {
                      onSuccess: () => toast.success('账号已解锁')
                    })
                  }
                >
                  <LockOpen />
                  解锁
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => setResetOpen(true)}>
                <KeyRound />
                重置密码
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil />
                编辑
              </Button>
            </Can>
          </PageHeaderActions>
        </PageHeader>

        <Tabs defaultValue="roles">
          <TabsList variant="line" className="mb-4 group-data-horizontal/tabs:h-12">
            <TabsTrigger value="roles">
              <Shield className="size-3.5" aria-hidden />
              角色 ({user.roles.length})
            </TabsTrigger>
            <TabsTrigger value="organizations">
              <Building2 className="size-3.5" aria-hidden />
              组织 ({user.organizations.length})
            </TabsTrigger>
            <TabsTrigger value="security">
              <KeyRound className="size-3.5" aria-hidden />
              安全
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-6 @5xl/content:flex-row">
            <div className="min-w-0 flex-1">
              <TabsContent value="roles">
                <UserRolesCard user={user} onAssign={() => setRolesOpen(true)} />
              </TabsContent>
              <TabsContent value="organizations">
                <UserOrganizationsCard user={user} onAssign={() => setOrgsOpen(true)} />
              </TabsContent>
              <TabsContent value="security">
                <UserSecurityCard user={user} />
              </TabsContent>
            </div>
            <UserDetailSideOverview user={user} />
          </div>
        </Tabs>
      </Main>

      <UserActionSheet currentRow={user} open={editOpen} onOpenChange={setEditOpen} />
      <UsersResetPasswordDialog currentRow={user} open={resetOpen} onOpenChange={setResetOpen} />
      <AssignUserRolesDialog user={user} open={rolesOpen} onOpenChange={setRolesOpen} />
      <AssignUserOrganizationsDialog user={user} open={orgsOpen} onOpenChange={setOrgsOpen} />
    </>
  )
}
