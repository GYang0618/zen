import { DEFAULT_AGENT_RUN_BUDGET } from '@zen/shared'
import {
  ClearToolUsesEdit,
  contextEditingMiddleware,
  humanInTheLoopMiddleware,
  modelCallLimitMiddleware,
  summarizationMiddleware,
  toolErrorMiddleware
} from 'langchain'

import { formatUnhandledToolError } from '@/api/tool-failure'
import { createApprovalPolicy } from '@/tools/policy'

import type { createModel } from '@/models'

export function createDefaultAgentMiddleware(model: ReturnType<typeof createModel>) {
  return [
    modelCallLimitMiddleware({
      runLimit: DEFAULT_AGENT_RUN_BUDGET.maxModelCalls,
      exitBehavior: 'error'
    }),
    humanInTheLoopMiddleware({
      interruptOn: createApprovalPolicy(),
      descriptionPrefix: 'Default Agent 请求执行高风险操作'
    }),
    contextEditingMiddleware({
      edits: [
        new ClearToolUsesEdit({
          trigger: { tokens: 48_000 },
          keep: { messages: 3 },
          placeholder: '[cleared]'
        })
      ]
    }),
    summarizationMiddleware({
      model,
      trigger: [{ tokens: 80_000 }, { messages: 50 }],
      keep: { messages: 10 },
      summaryPrefix: '此前对话摘要：'
    }),
    toolErrorMiddleware({
      onError: (error, request) => formatUnhandledToolError(error, request.toolCall.name)
    })
  ]
}
