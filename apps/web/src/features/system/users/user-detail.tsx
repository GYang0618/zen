import { Link, useRouter } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderMedia,
  PageHeaderTitle,
  Skeleton
} from '@zen/ui'
import { ArrowLeft, KeyRound, LockOpen } from 'lucide-react'
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
import { UsersResetPasswordDialog } from './components/users-reset-password-dialog'
import { statusConfig } from './data/data'
import { useRevokeUserSessionsMutation, useUnlockUserMutation } from './mutations'
import { useUserQuery } from './queries'
import { getUserDisplayName, getUserInitials } from './utils'

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
  const { history } = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [rolesOpen, setRolesOpen] = useState(false)
  const [orgsOpen, setOrgsOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const { mutate: unlockUser, isPending: isUnlocking } = useUnlockUserMutation()
  const { mutate: revokeUserSessions, isPending: isRevokingSessions } = useRevokeUserSessionsMutation()
  const status = statusConfig[user.status]
  const displayName = getUserDisplayName(user)

  const handleRevokeSessions = () => {
    const confirmed = window.confirm(`确定强制下线用户“${user.username}”的全部在线会话吗？`)
    if (!confirmed) return

    revokeUserSessions(user.id, {
      onSuccess: () => toast.success('已强制下线该用户的全部会话'),
      onError: (error) => toast.error(error instanceof Error ? error.message : '强制下线失败')
    })
  }

  return (
    <>
      <AppHeader />
      <Main className="flex-1 flex flex-col gap-4">
        <PageHeader size="lg">
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            aria-label="返回上一页"
            onClick={() => history.go(-1)}
          >
            <ArrowLeft />
          </Button>
          <PageHeaderMedia>
            <Avatar className="size-16">
              <AvatarImage src={user.avatar ?? undefined} alt={displayName} />
              <AvatarFallback className="text-3xl">{getUserInitials(user)}</AvatarFallback>
            </Avatar>
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
              <Button variant="outline" disabled={isRevokingSessions} onClick={handleRevokeSessions}>
                强制下线
              </Button>
            </Can>
          </PageHeaderActions>
        </PageHeader>
        <div className="flex gap-6">
          <section className="flex-1 space-y-4">
            <UserRolesCard user={user} onAssign={() => setRolesOpen(true)} />
            <UserOrganizationsCard user={user} onAssign={() => setOrgsOpen(true)} />
          </section>
          <UserDetailSideOverview user={user} onEdit={() => setEditOpen(true)} />
        </div>
      </Main>

      <UserActionSheet currentRow={user} open={editOpen} onOpenChange={setEditOpen} />
      <UsersResetPasswordDialog currentRow={user} open={resetOpen} onOpenChange={setResetOpen} />
      <AssignUserRolesDialog user={user} open={rolesOpen} onOpenChange={setRolesOpen} />
      <AssignUserOrganizationsDialog user={user} open={orgsOpen} onOpenChange={setOrgsOpen} />
    </>
  )
}
