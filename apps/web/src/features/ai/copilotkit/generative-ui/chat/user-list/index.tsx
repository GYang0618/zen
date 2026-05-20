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
      description: '渲染用户列表表格，渲染的数据已经在表格内部进行获取，你无法接受到真实数据',
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
