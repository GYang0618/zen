import { useRenderTool } from '@copilotkit/react-core/v2'
import { jobProfilesPageSchema } from '@zen/shared'
import z from 'zod'

import { AITable } from '@/components/ai'
import { emptyToolRender } from '@/components/ai/empty-tool-render'
import { columns } from '@/features/system/posts'

const tableColumns = columns.filter((col) => col.id !== 'actions')

function parseJobProfilesPageResult(result: string) {
  try {
    const parsed = jobProfilesPageSchema.safeParse(unwrapToolData(JSON.parse(result) as unknown))
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

export function useJobProfilesTable() {
  useRenderTool(
    {
      name: 'query_job_profiles_list',
      parameters: z.object({}),
      render: ({ status, result }) => {
        if (status !== 'complete') return emptyToolRender()

        const data = parseJobProfilesPageResult(result ?? '')
        if (!data) return emptyToolRender()

        return <AITable data={data.items} columns={tableColumns} />
      }
    },
    []
  )
}
