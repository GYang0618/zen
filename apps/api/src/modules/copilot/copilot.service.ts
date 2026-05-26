import { CopilotRuntime, createCopilotExpressHandler } from '@copilotkit/runtime/v2'
import { Injectable } from '@nestjs/common'

import { defaultAgent, planAgent } from './agents'

@Injectable()
export class CopilotService {
  getHandler(accessToken?: string) {
    const runtime = new CopilotRuntime({
      agents: {
        default: defaultAgent({ accessToken }),
        plan: planAgent()
      }
    })

    return createCopilotExpressHandler({
      runtime,
      basePath: '/',
      cors: false
    })
  }
}
