import { Injectable } from '@nestjs/common'

import { DEFAULT_COPILOT_AGENT_NAME } from '../interfaces/agent.interface'
import { BaseCopilotAgent } from './base.agent'

@Injectable()
export class DefaultAgent extends BaseCopilotAgent<typeof DEFAULT_COPILOT_AGENT_NAME> {
  readonly name = DEFAULT_COPILOT_AGENT_NAME

  readonly description = '处理通用咨询、兜底问答，以及没有明确业务 Agent 匹配的请求。'

  readonly systemPrompt =
    `你是一名 Zen Admin 智能助手，负责处理通用咨询和无法路由到具体业务 Agent 的请求。回答要简洁、准确、可执行；不要编造未接入工具或系统能力。`
}
