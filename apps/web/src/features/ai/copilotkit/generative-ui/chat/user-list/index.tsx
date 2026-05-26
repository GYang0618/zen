import { useRenderTool } from '@copilotkit/react-core/v2'
import { usersPageSchema } from '@zen/shared'
import z from 'zod'

import { AITable } from '@/components/ai'
import { columns } from '@/features/system/users'

const tableColumns = columns.filter((col) => col.id !== 'select' && col.id !== 'actions')

function parseUsersPageResult(result: string) {
  try {
    const parsed = usersPageSchema.safeParse(JSON.parse(result) as unknown)
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

export function useUserList() {
  useUsersTable()
}

function useUsersTable() {
  useRenderTool(
    {
      name: 'query_users_list',
      parameters: z.object({}),
      render: ({ result }) => {
        const data = parseUsersPageResult(result ?? '')
        return <AITable data={data?.items ?? []} columns={tableColumns} />
      }
    },
    []
  )
}
