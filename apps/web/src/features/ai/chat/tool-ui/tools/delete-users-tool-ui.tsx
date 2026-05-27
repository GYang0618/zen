import { deleteUsersSchema } from '@zen/shared'
import { Badge, Button } from '@zen/ui'
import { z } from 'zod'

import { makeAssistantToolUI, ToolDenied, ToolError, ToolPending } from '@/components/tool-ui'

import { useCopilot } from '../../copilot-provider'

import type { AssistantToolUIState } from '@/components/tool-ui'

const deleteUsersOutputSchema = z.array(z.object({ id: z.string() }).passthrough())

type DeleteUsersInput = z.infer<typeof deleteUsersSchema>
type DeleteUsersOutput = z.infer<typeof deleteUsersOutputSchema>
type PendingDeleteUsersState = Extract<
  AssistantToolUIState<DeleteUsersInput, DeleteUsersOutput>,
  { phase: 'pending' }
>

interface DeleteUsersApprovalProps {
  actionLabel: string
  state: PendingDeleteUsersState
}

function DeleteUsersApproval({ actionLabel, state }: DeleteUsersApprovalProps) {
  const { addToolApprovalResponse, status } = useCopilot()
  const approvalId = state.approval?.id
  const isSubmitting = status === 'submitted' || status === 'streaming'

  if (state.status !== 'approval-requested' || !approvalId) {
    return <ToolPending status={state.status} />
  }

  const userCount = state.input.ids.length

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">需要审批：{actionLabel}用户</span>
        <Badge variant="secondary">{userCount} 个</Badge>
      </div>
      <p className="text-muted-foreground">
        Agent 请求{actionLabel}以下用户 ID：{state.input.ids.join('、')}。审批通过后才会真正执行。
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={isSubmitting}
          onClick={() => addToolApprovalResponse({ id: approvalId, approved: true })}
        >
          通过
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isSubmitting}
          onClick={() =>
            addToolApprovalResponse({
              id: approvalId,
              approved: false,
              reason: `用户拒绝${actionLabel}用户`
            })
          }
        >
          拒绝
        </Button>
      </div>
    </div>
  )
}

function createDeleteUsersToolUI(toolName: string, actionLabel: string) {
  return makeAssistantToolUI({
    toolName,
    inputSchema: deleteUsersSchema,
    outputSchema: deleteUsersOutputSchema,
    render: (state) => {
      switch (state.phase) {
        case 'pending':
          return <DeleteUsersApproval actionLabel={actionLabel} state={state} />

        case 'error':
          return <ToolError status={state.status} error={state.error} errorText={state.errorText} />

        case 'denied':
          return <ToolDenied reason={state.reason} />

        case 'ready':
          return (
            <p className="rounded-md border bg-muted/30 p-3 text-sm">
              已{actionLabel}
              {state.data.length} 个用户。
            </p>
          )
      }
    }
  })
}

export const DeleteUsersToolUI = createDeleteUsersToolUI('delete_users', '删除')
export const HardDeleteUsersToolUI = createDeleteUsersToolUI('hard_delete_users', '彻底删除')
