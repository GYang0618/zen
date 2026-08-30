import { CopilotRuntime, createCopilotExpressHandler } from '@copilotkit/runtime/v2'
import { Inject, Injectable } from '@nestjs/common'

import { CONFIG_NAMESPACES } from '@/config'
import { TenantPluginStateService } from '@/modules/plugin/tenant-plugin-state.service'

import { defaultAgent, planAgent } from './agents'
import { DefaultAgentRunControl } from './default-agent-run-control'
import { DefaultAgentRuntimeStore } from './default-agent-runtime.store'

import type { LanggraphConfig } from '@/config'
import type { DefaultAgentRequestContext } from './default-agent-runtime.types'

@Injectable()
export class CopilotService {
  constructor(
    @Inject(CONFIG_NAMESPACES.LANGGRAPH)
    private readonly langgraphCfg: LanggraphConfig,
    @Inject(DefaultAgentRuntimeStore)
    private readonly runtimeStore: DefaultAgentRuntimeStore,
    @Inject(TenantPluginStateService)
    private readonly pluginState: TenantPluginStateService,
    @Inject(DefaultAgentRunControl)
    private readonly runControl: DefaultAgentRunControl
  ) {}

  async getHandler(
    accessToken: string | undefined,
    context: DefaultAgentRequestContext,
    threadId?: string,
    runId?: string
  ) {
    const { deploymentUrl } = this.langgraphCfg
    const [memory, activePluginIds] = await Promise.all([
      this.runtimeStore.getPromptMemory(context.auth, threadId),
      this.pluginState.listActiveIds(context.auth.tenantId)
    ])
    const runtime = new CopilotRuntime({
      agents: {
        default: defaultAgent({
          deploymentUrl,
          accessToken,
          activePluginIds,
          memory,
          runId,
          runControl: this.runControl,
          runtimeHooks: this.runtimeStore.createHooks(context)
        }),
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
