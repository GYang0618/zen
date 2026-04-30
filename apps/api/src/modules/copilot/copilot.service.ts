import { randomUUID } from 'node:crypto'

import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain'
import { Command } from '@langchain/langgraph'
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common'

import { CopilotAgentService } from './copilot-agent.service'

import type { HITLResponse } from 'langchain'
import type { CallDto } from './dto/call.dto'

const DEFAULT_REJECTION_MESSAGE = '用户拒绝执行删除操作'

interface ApprovalRespondedToolPart {
  type: 'dynamic-tool'
  state: 'approval-responded'
  approval: {
    approved: boolean
    reason?: string
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function isApprovalRespondedToolPart(part: unknown): part is ApprovalRespondedToolPart {
  if (!isRecord(part)) return false
  if (part.type !== 'dynamic-tool' || part.state !== 'approval-responded') return false
  if (!isRecord(part.approval)) return false

  return typeof part.approval.approved === 'boolean'
}

/**
 * Copilot 核心服务，负责请求处理与流式响应编排
 */
@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name)

  constructor(@Inject(CopilotAgentService) private readonly agentService: CopilotAgentService) {}

  async call({ id, messages, enableThinking = false }: CallDto) {
    const approvalResume = this.createApprovalResume(messages)
    if (approvalResume && !id) {
      throw new BadRequestException('审批恢复请求缺少会话 ID')
    }
    const agent = this.agentService.buildAgent()
    const input: Parameters<typeof agent.stream>[0] = approvalResume
      ? (new Command({ resume: approvalResume }) as Parameters<typeof agent.stream>[0])
      : { input: await toBaseMessages(messages), enableThinking }

    const stream = await agent.stream(input, {
      configurable: { thread_id: this.resolveThreadId(id) },
      streamMode: ['values', 'messages', 'custom']
    })

    return toUIMessageStream(stream, {
      onError: (error) => {
        this.logger.error(`Agent 执行错误: ${error.message}`)
      }
    })
  }

  private createApprovalResume(messages: CallDto['messages']): HITLResponse | undefined {
    const lastAssistantMessage = messages.filter((message) => message.role === 'assistant').at(-1)
    if (!lastAssistantMessage) return undefined

    const decisions = (lastAssistantMessage.parts as readonly unknown[])
      .filter(isApprovalRespondedToolPart)
      .map((part) => {
        if (part.approval.approved) return { type: 'approve' } as const

        return {
          type: 'reject',
          message: part.approval.reason ?? DEFAULT_REJECTION_MESSAGE
        } as const
      })

    if (decisions.length === 0) return undefined

    return { decisions }
  }

  private resolveThreadId(id: string | undefined): string {
    return id?.trim() || randomUUID()
  }
}
