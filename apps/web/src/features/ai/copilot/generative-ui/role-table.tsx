import { useRenderTool } from '@copilotkit/react-core/v2'
import { rolesPageSchema } from '@zen/shared'
import z from 'zod'

import { AITable } from '@/components/ai'
import { columns } from '@/features/system/roles'

const tableColumns = columns.filter((col) => col.id !== 'select' && col.id !== 'actions')

function parseRolesPageResult(result: string) {
  try {
    const parsed = rolesPageSchema.safeParse(JSON.parse(result) as unknown)
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

export function useRolesTable() {
  useRenderTool(
    {
      name: 'query_roles_list',
      parameters: z.object({}),
      render: ({ result }) => {
        const data = parseRolesPageResult(result ?? '')
        return <AITable data={data?.items ?? []} columns={tableColumns} />
      }
    },
    []
  )
}
