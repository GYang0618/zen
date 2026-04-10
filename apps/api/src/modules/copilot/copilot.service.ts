import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain'
import { ChatOpenAI } from '@langchain/openai'
import { Injectable } from '@nestjs/common'
import { createUIMessageStreamResponse } from 'ai'
import { createAgent } from 'langchain'

import type { CallDto } from './dto/call.dto'

@Injectable()
export class CopilotService {
  async call({ messages }: CallDto) {
    const langchainMessages = await toBaseMessages(messages)
    const agent = await _createAgent()
    const stream = await agent.streamEvents({ messages: langchainMessages }, { version: 'v2' })

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream)
    })
  }
}

async function _createAgent() {
  const model = new ChatOpenAI({ model: 'gpt-5-mini' })
  const agent = createAgent({
    model
  })

  return agent
}
