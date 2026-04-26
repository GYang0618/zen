import { usersPageSchema } from '@zen/shared'

import { AITable } from '@/components/ai'
import { makeAssistantToolUI, ToolDenied, ToolError, ToolPending } from '@/components/tool-ui'
import { columns } from '@/features/system/users'

const tableColumns = columns.filter((col) => col.id !== 'select' && col.id !== 'actions')

export const GetUsersToolUI = makeAssistantToolUI({
  toolName: 'get_users',
  outputSchema: usersPageSchema,
  render: (state) => {
    switch (state.phase) {
      case 'pending':
        return <ToolPending status={state.status} />

      case 'error':
        return <ToolError status={state.status} error={state.error} errorText={state.errorText} />

      case 'denied':
        return <ToolDenied reason={state.reason} />

      case 'ready':
        return state.data.items.length ? (
          <div
            className="rounded-md border transition-opacity data-preliminary:opacity-60"
            data-preliminary={state.isPreliminary || undefined}
          >
            <AITable data={state.data.items} columns={tableColumns} />
          </div>
        ) : null
    }
  }
})
