import { useRenderTool } from '@copilotkit/react-core/v2'
import { jobProfilesPageSchema } from '@zen/shared'
import z from 'zod'

import { AITable } from '@/components/ai'
import { emptyToolRender } from '@/components/ai/empty-tool-render'
import { columns } from '@/features/system/posts'

const tableColumns = columns.filter((col) => col.id !== 'actions')

function parseJobProfilesPageResult(result: string) {
  try {
    const parsed = jobProfilesPageSchema.safeParse(JSON.parse(result) as unknown)
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
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
