import { useComponent } from '@copilotkit/react-core/v2'
import { usersQuerySchema } from '@zen/shared'

import { AITable } from '@/components/ai'
import { columns, useUsersQuery } from '@/features/system/users'

import type { UsersQuery } from '@zen/shared'

const tableColumns = columns.filter((col) => col.id !== 'select' && col.id !== 'actions')

export function useUserList() {
  useUsersTable()
}

function useUsersTable() {
  useComponent(
    {
      name: 'query-users-table',
      description: '查询用户，可以通过关键字、用户状态、角色等条件进行查询',
      parameters: usersQuerySchema,
      render: (params) => <UsersTable query={params} />
    },
    []
  )
}

function UsersTable({ query }: { query: UsersQuery }) {
  const { data, isLoading, isFetching } = useUsersQuery(query)
  const users = data?.items ?? []

  return (
    <AITable data={users} columns={tableColumns} isLoading={isLoading} isFetching={isFetching} />
  )
}
