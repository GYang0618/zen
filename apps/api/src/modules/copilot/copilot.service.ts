import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain'
import { Injectable, Logger } from '@nestjs/common'

import { CopilotAgentService } from './copilot-agent.service'

import type { CallDto } from './dto/call.dto'

/**
 * Copilot 核心服务，负责请求处理与流式响应编排
 */
@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name)

  constructor(private readonly agentService: CopilotAgentService) {}

  async call({ messages }: CallDto) {
    const langchainMessages = await toBaseMessages(messages)
    const agent = this.agentService.buildAgent()

    const stream = await agent.stream(
      { messages: langchainMessages },
      { streamMode: ['values', 'messages', 'custom'] }
    )

    return toUIMessageStream(stream, {
      onError: (error) => {
        this.logger.error(`Graph execution error: ${error.message}`)
      }
    })
  }
}
