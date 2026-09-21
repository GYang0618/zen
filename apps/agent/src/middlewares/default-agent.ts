import { DEFAULT_AGENT_RUN_BUDGET } from '@zen/shared'
import {
  ClearToolUsesEdit,
  contextEditingMiddleware,
  humanInTheLoopMiddleware,
  modelCallLimitMiddleware,
  modelFallbackMiddleware,
  modelRetryMiddleware,
  summarizationMiddleware,
  toolErrorMiddleware,
  toolRetryMiddleware
} from 'langchain'

import { formatUnhandledToolError } from '@/api/tool-failure'
import { createModel } from '@/models'
import { createApprovalPolicy } from '@/tools/policy'

import { MODEL_RETRY_CONFIG, TOOL_RETRY_CONFIG } from './retry-policy'

export function createDefaultAgentMiddleware(model: ReturnType<typeof createModel>) {
  return [
    modelCallLimitMiddleware({
      runLimit: DEFAULT_AGENT_RUN_BUDGET.maxModelCalls,
      exitBehavior: 'error'
    }),
    summarizationMiddleware({
      model,
      trigger: [{ tokens: 80_000 }, { messages: 50 }],
      keep: { messages: 10 },
      summaryPrefix: '此前对话摘要：'
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
    modelFallbackMiddleware(createModel({ model: 'deepseek-v4-pro' })),
    modelRetryMiddleware(MODEL_RETRY_CONFIG),
    toolErrorMiddleware({
      onError: (error, request) => formatUnhandledToolError(error, request.toolCall.name)
    }),
    toolRetryMiddleware(TOOL_RETRY_CONFIG)
  ]
}
