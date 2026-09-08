import { useRenderTool } from '@copilotkit/react-core/v2'
import z from 'zod'

import { AITable } from '@/components/ai'
import { emptyToolRender } from '@/components/ai/empty-tool-render'
import { columns } from '@/features/system/posts'

import { parseJobProfilesPageResult } from './parse-table-result'

import type { JobProfile } from '@zen/shared'

const tableColumns = columns.filter((col) => col.id !== 'actions')

export function useJobProfilesTable() {
  useRenderTool(
    {
      name: 'query_job_profiles_list',
      parameters: z.object({}),
      render: ({ status, result }) => {
        if (status === 'inProgress') {
          return <AITable data={[]} columns={tableColumns} isLoading={true} skeletonRowCount={5} />
        }
        if (!result) return emptyToolRender()

        const data = parseJobProfilesPageResult(result)
        if (!data || data.items.length === 0) return emptyToolRender()

        return <AITable data={data.items as unknown as JobProfile[]} columns={tableColumns} />
      }
    },
    []
  )
}
