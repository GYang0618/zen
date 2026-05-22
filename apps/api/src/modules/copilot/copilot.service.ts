import { CopilotRuntime, createCopilotExpressHandler } from '@copilotkit/runtime/v2'
import { Injectable } from '@nestjs/common'
import { ACCESS_TOKEN_CONFIGURABLE_KEY } from '@zen/shared'

import { LangGraphAgent } from './langgraph-runtime-agent'

const agents = {
  default: { url: 'http://localhost:3600', graphId: 'default_agent' }
}

@Injectable()
export class CopilotService {
  getHandler(accessToken?: string) {
    const defaultAgent = new LangGraphAgent({
      deploymentUrl: agents.default.url,
      graphId: agents.default.graphId,
      assistantConfig: accessToken
        ? {
            configurable: {
              [ACCESS_TOKEN_CONFIGURABLE_KEY]: accessToken
            }
          }
        : undefined
    })

    const runtime = new CopilotRuntime({
      agents: {
        default: defaultAgent
      }
    })

    return createCopilotExpressHandler({
      runtime,
      basePath: '/',
      cors: false
    })
  }
}
