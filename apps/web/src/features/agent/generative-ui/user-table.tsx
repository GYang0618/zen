import { useRenderTool } from '@copilotkit/react-core/v2'
import { usersPageSchema } from '@zen/shared'
import z from 'zod'

import { AITable } from '@/components/ai'
import { emptyToolRender } from '@/components/ai/empty-tool-render'
import { columns } from '@/features/system/users'

const tableColumns = columns.filter((col) => col.id !== 'select' && col.id !== 'actions')

function parseUsersPageResult(result: string) {
  try {
    const parsed = usersPageSchema.safeParse(unwrapToolData(JSON.parse(result) as unknown))
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

function unwrapToolData(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || !('success' in value)) return value
  const result = value as { success?: unknown; data?: unknown }
  return result.success === true ? result.data : value
}

export function useUsersTable() {
  useRenderTool(
    {
      name: 'query_users_list',
      parameters: z.object({}),
      render: ({ status, result }) => {
        if (status !== 'complete') return emptyToolRender()

        const data = parseUsersPageResult(result ?? '')
        if (!data || data.items.length === 0) return emptyToolRender()

        return <AITable data={data.items} columns={tableColumns} />
      }
    },
    []
  )
}
