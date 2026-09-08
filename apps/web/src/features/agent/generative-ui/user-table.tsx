import { useRenderTool } from '@copilotkit/react-core/v2'
import { usersPageSchema } from '@zen/shared'
import z from 'zod'

import { AITable } from '@/components/ai'
import { emptyToolRender } from '@/components/ai/empty-tool-render'
import { columns } from '@/features/system/users'

import { useAgentToolResult } from '../hooks/use-agent-tool-result'

import type { AgentToolCallStatus } from '../lib/parse-agent-tool-result'

const tableColumns = columns.filter((col) => col.id !== 'select' && col.id !== 'actions')

interface UsersTableToolViewProps {
  status: AgentToolCallStatus
  result: string | undefined
}

function UsersTableToolView({ status, result }: UsersTableToolViewProps) {
  const { phase, success, data } = useAgentToolResult(result, {
    status,
    schema: usersPageSchema
  })

  if (phase === 'pending') {
    return <AITable data={[]} columns={tableColumns} isLoading={true} skeletonRowCount={5} />
  }

  if (!success || !data || data.items.length === 0) {
    return emptyToolRender()
  }

  return <AITable data={data.items} columns={tableColumns} />
}

export function useUsersTableRender() {
  useRenderTool(
    {
      name: 'query_users_list',
      parameters: z.object({}),
      render: ({ status, result }) => <UsersTableToolView status={status} result={result} />
    },
    []
  )
}
