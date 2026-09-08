import { useRenderTool } from '@copilotkit/react-core/v2'
import z from 'zod'

import { AITable } from '@/components/ai'
import { emptyToolRender } from '@/components/ai/empty-tool-render'
import { columns } from '@/features/system/users'

import { parseUsersPageResult } from './parse-table-result'

import type { User } from '@zen/shared'

const tableColumns = columns.filter((col) => col.id !== 'select' && col.id !== 'actions')

export function useUsersTable() {
  useRenderTool(
    {
      name: 'query_users_list',
      parameters: z.object({}),
      render: ({ status, result }) => {
        if (status === 'inProgress') {
          return <AITable data={[]} columns={tableColumns} isLoading={true} skeletonRowCount={5} />
        }
        if (!result) return emptyToolRender()
        const data = parseUsersPageResult(result)
        if (!data || data.items.length === 0) return emptyToolRender()

        return <AITable data={data.items as unknown as User[]} columns={tableColumns} />
      }
    },
    []
  )
}
