import { CopilotRuntime, createCopilotExpressHandler } from '@copilotkit/runtime/v2'
import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { CONFIG_NAMESPACES } from '@/config'
import { TenantPluginStateService } from '@/modules/plugin/tenant-plugin-state.service'

import { defaultAgent, planAgent } from './agents'
import { DefaultAgentRunControl } from './default-agent-run-control'
import { DefaultAgentRuntimeStore } from './default-agent-runtime.store'

import type { AuthContext } from '@zen/shared'
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
    private readonly runControl: DefaultAgentRunControl,
    @Inject(JwtService)
    private readonly jwtService: JwtService
  ) {}

  async getHandler(
    accessToken: string | undefined,
    context: DefaultAgentRequestContext,
    threadId?: string,
    runId?: string
  ) {
    const { deploymentUrl } = this.langgraphCfg
    const isExecution = Boolean(threadId || runId)

    const [memory, activePluginIds, stepUpToken] = await Promise.all([
      isExecution ? this.runtimeStore.getPromptMemory(context.auth, threadId) : undefined,
      this.pluginState.listActiveIds(context.auth.tenantId),
      isExecution ? this.issueHitlStepUpToken(context.auth) : undefined
    ])

    const runtime = new CopilotRuntime({
      agents: {
        default: defaultAgent({
          deploymentUrl,
          accessToken,
          activePluginIds,
          memory,
          runId,
          stepUpToken,
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

  private async issueHitlStepUpToken(auth: AuthContext): Promise<string | undefined> {
    if (!(await this.runtimeStore.hasRecentApprovedHitl(auth))) return undefined
    return this.jwtService.sign(
      { sub: auth.userId, typ: 'step-up', purpose: 'agent-hitl' },
      { expiresIn: '3m' }
    )
  }
}
