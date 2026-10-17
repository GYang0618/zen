import { createAgent } from 'langchain'

import { createFrontendToolsMiddleware, createUsageMiddleware } from '@/middlewares'
import { createModel } from '@/models'

export function createPageAgent() {
  const model = createModel()
  return createAgent({
    model,
    tools: [],
    systemPrompt:
      '你是当前所在模块页面的辅助助手，负责该页面上的操作和跨页面公共能力。所有回答一律使用简体中文。',
    middleware: [createUsageMiddleware('chat'), createFrontendToolsMiddleware([])]
  })
}

export const agent = createPageAgent()
