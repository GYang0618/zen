import { CopilotRuntime, createCopilotExpressHandler } from '@copilotkit/runtime/v2'
import { Inject, Injectable } from '@nestjs/common'

import { CONFIG_NAMESPACES } from '@/config'

import { defaultAgent, planAgent } from './agents'

import type { LanggraphConfig } from '@/config'

@Injectable()
export class CopilotService {
  constructor(
    @Inject(CONFIG_NAMESPACES.LANGGRAPH)
    private readonly langgraphCfg: LanggraphConfig
  ) {}

  getHandler(accessToken?: string) {
    const { deploymentUrl } = this.langgraphCfg
    const runtime = new CopilotRuntime({
      agents: {
        default: defaultAgent({ deploymentUrl, accessToken }),
        plan: planAgent({ deploymentUrl })
      }
    })

    return createCopilotExpressHandler({
      runtime,
      basePath: '/',
      cors: false
    })
  }
}
