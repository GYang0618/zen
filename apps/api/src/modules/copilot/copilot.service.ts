import { CopilotRuntime, createCopilotExpressHandler } from '@copilotkit/runtime/v2'
import { Injectable } from '@nestjs/common'

import { LangGraphAgent } from './langgraph-runtime-agent'

@Injectable()
export class CopilotService {
  getHandler() {
    const defaultAgent = new LangGraphAgent({
      deploymentUrl: 'http://localhost:2024',
      graphId: 'langchain_agent'
    })

    const runtime = new CopilotRuntime({
      agents: {
        default: defaultAgent
      }
    })

    const handler = createCopilotExpressHandler({
      runtime,
      basePath: '/',
      cors: false
    })

    return handler
  }
}
