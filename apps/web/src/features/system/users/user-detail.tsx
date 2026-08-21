import { Link, useRouter } from '@tanstack/react-router'
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
  Skeleton
} from '@zen/ui'
import { ArrowLeft, KeyRound, LockOpen, LogOut } from 'lucide-react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { EmptyState } from '@/components/empty-state'
import { AppHeader, Main } from '@/components/layouts'

import { UserAvatar } from './components/user-avatar'
import { UserDetailSideOverview } from './components/user-detail-side-overview'
import { UserOrganizationsCard } from './components/user-organizations-card'
import { UserRolesCard } from './components/user-roles-card'
import { UsersDetailDialogs } from './components/users-detail-dialogs'
import { useUnlockUserMutation } from './mutations'
import { useUserQuery } from './queries'
import { UsersDetailProvider, useUsersDetail } from './users-detail-provider'
import { getUserDisplayName } from './utils'

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

  return (
    <UsersDetailProvider user={data}>
      <UserDetailContent />
    </UsersDetailProvider>
  )
}

function UserDetailContent() {
  const { history } = useRouter()
  const { user, setOpen } = useUsersDetail()
  const { mutate: unlockUser, isPending: isUnlocking } = useUnlockUserMutation()

  const displayName = getUserDisplayName(user)

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
            <UserAvatar user={user} className="size-16" fallbackClassName="text-3xl" />
          </PageHeaderMedia>
          <PageHeaderContent>
            <PageHeaderTitle as="h1" className="inline-flex flex-wrap items-center gap-3">
              {displayName}
            </PageHeaderTitle>
            <PageHeaderDescription className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono">@{user.username}</span>
              <span>•</span>
              {user.isLocked ? <Badge variant="secondary">已锁定</Badge> : null}
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
              <Button variant="outline" onClick={() => setOpen('reset-password')}>
                <KeyRound />
                重置密码
              </Button>
              <Button variant="destructive" onClick={() => setOpen('revoke-sessions')}>
                <LogOut />
                强制下线
              </Button>
            </Can>
          </PageHeaderActions>
        </PageHeader>
        <div className="flex gap-6 @5xl:flex-row flex-col">
          <section className="flex-1 space-y-4">
            <UserRolesCard user={user} onAssign={() => setOpen('assign-roles')} />
            <UserOrganizationsCard user={user} onAssign={() => setOpen('assign-organizations')} />
          </section>
          <UserDetailSideOverview user={user} onEdit={() => setOpen('edit')} />
        </div>
      </Main>

      <UsersDetailDialogs />
    </>
  )
}
