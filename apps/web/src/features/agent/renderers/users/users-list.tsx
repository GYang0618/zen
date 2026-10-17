import { LayoutGrid, TextAlignStart } from 'lucide-react'
import { useMemo } from 'react'

import { UsersCard, columns as userColumns } from '@/features/system/users'

import { AgentCardScroll } from '../../components/agent-card-scroll'
import { DataTable, ViewSwitcher } from '../../generative-ui'
import { withListActions } from '../with-list-actions'
import { UserAgentMenu } from './user-menu'

import type { PageMeta, UserListItem } from '@zen/shared'

interface UsersListViewProps {
  title: string
  data: UserListItem[]
  description?: string
  pagination?: PageMeta
  loading?: boolean
}

export function UsersList({ title, description, data, loading = false }: UsersListViewProps) {
  const columns = useMemo(
    () => withListActions(userColumns, (user) => <UserAgentMenu user={user} />),
    []
  )
  const views = useMemo(
    () => [
      {
        key: 'card',
        icon: LayoutGrid,
        render:
          data.length === 0 && !loading ? (
            <EmptyHint message="暂无用户数据" />
          ) : (
            <AgentCardScroll
              key={data.map((user) => user.id).join(':')}
              items={data}
              renderItem={(user) => (
                <UsersCard user={user} actions={<UserAgentMenu user={user} appearance="card" />} />
              )}
            />
          )
      },
      {
        key: 'table',
        icon: TextAlignStart,
        render: (
          <DataTable
            data={data}
            columns={columns}
            isLoading={loading}
            emptyMessage="暂无用户数据"
          />
        )
      }
    ],
    [columns, data, loading]
  )

  return (
    <ViewSwitcher
      title={title ?? '用户查询结果'}
      description={description}
      views={views}
      loading={loading}
    />
  )
}

function EmptyHint({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
