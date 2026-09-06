import { createAgent } from 'langchain'

import { createQwenModel } from '@/models'

import { createFrontendToolsMiddleware } from './frontend-tools.js'
import {
  GENERATIVE_UI_REPLY_RULES,
  MODULE_NAVIGATION_RULES,
  REASONING_STYLE_RULES
} from './prompts'

export function createPlanAgent() {
  const model = createQwenModel()
  return createAgent({
    model,
    tools: [],
    systemPrompt: [
      '你是一个智能辅助助手，能够协助用户完成各种任务，所有的回答一律使用简体中文回答。',
      MODULE_NAVIGATION_RULES,
      GENERATIVE_UI_REPLY_RULES,
      REASONING_STYLE_RULES
    ].join('\n'),
    middleware: [createFrontendToolsMiddleware([])]
  })
}

export const agent = createPlanAgent()
