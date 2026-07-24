import { createFileRoute } from '@tanstack/react-router'

import { UserDetail } from '@/features/system/users/user-detail'

export const Route = createFileRoute('/_authenticated/system/_identity/users_/$userId')({
  component: UserDetailPage,
  staticData: {
    title: '用户详情',
    hideInMenu: true,
    permissions: ['system:user:list']
  }
})

function UserDetailPage() {
  const { userId } = Route.useParams()
  return <UserDetail userId={userId} />
}
