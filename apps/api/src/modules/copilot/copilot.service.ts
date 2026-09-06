import { CopilotRuntime, createCopilotExpressHandler } from '@copilotkit/runtime/v2'
import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { CONFIG_NAMESPACES } from '../../config/index.js'
import { TenantPluginStateService } from '../plugin/tenant-plugin-state.service.js'
import { defaultAgent, planAgent } from './agents.js'
import { DefaultAgentRunControl } from './default-agent-run-control.js'
import { DefaultAgentRuntimeStore } from './default-agent-runtime.store.js'

import type { OnModuleInit } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'
import type { Request } from 'express'
import type { AppConfig, LanggraphConfig } from '../../config/index.js'
import type { DefaultAgentRequestContext } from './default-agent-runtime.types.js'

export function copilotKitBasePath(apiPrefix: string): string {
  const prefix = apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`
  return `${prefix.replace(/\/$/, '')}/copilot`
}

@Injectable()
export class CopilotService implements OnModuleInit {
  private handler!: ReturnType<typeof createCopilotExpressHandler>
  constructor(
    @Inject(CONFIG_NAMESPACES.APP)
    private readonly appCfg: AppConfig,
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

  onModuleInit() {
    const { deploymentUrl } = this.langgraphCfg
    const runtime = new CopilotRuntime({
      agents: async ({ request }) => {
        const accessToken = request.headers.get('x-zen-access-token') ?? undefined
        const context = JSON.parse(
          request.headers.get('x-zen-agent-context') ?? '{}'
        ) as DefaultAgentRequestContext & { threadId?: string; runId?: string }
        const [memory, activePluginIds, stepUp] = await Promise.all([
          this.runtimeStore.getPromptMemory(context.auth, context.threadId),
          this.pluginState.listActiveIds(context.auth.tenantId),
          this.issueHitlStepUpToken(context.auth, context.runId)
        ])
        return {
          default: defaultAgent({
            deploymentUrl,
            accessToken,
            auth: context.auth,
            locale: 'zh-CN',
            traceId: context.traceId,
            threadId: context.threadId,
            activePluginIds,
            memory,
            runId: context.runId,
            stepUpToken: stepUp?.token,
            approvalId: stepUp?.approvalId,
            toolName: stepUp?.toolName,
            runControl: this.runControl,
            runtimeHooks: this.runtimeStore.createHooks(context)
          }),
          plan: planAgent({ deploymentUrl })
        }
      }
    })
    this.handler = createCopilotExpressHandler({
      runtime,
      basePath: copilotKitBasePath(this.appCfg.apiPrefix),
      cors: false
    })
  }

  prepareRequest(
    req: Request,
    accessToken: string | undefined,
    context: DefaultAgentRequestContext,
    threadId?: string,
    runId?: string
  ) {
    req.headers['x-zen-access-token'] = accessToken ?? ''
    req.headers['x-zen-agent-context'] = JSON.stringify({ ...context, threadId, runId })
  }

  getHandler() {
    return this.handler
  }

  private async issueHitlStepUpToken(
    auth: AuthContext,
    runId?: string
  ): Promise<{ token: string; approvalId: string; toolName: string } | undefined> {
    if (!runId) return undefined
    const grant = await this.runtimeStore.getStepUpGrant(auth, runId)
    if (!grant) return undefined
    return {
      token: this.jwtService.sign(
        {
          sub: auth.userId,
          typ: 'step-up',
          purpose: 'agent-hitl',
          tenantId: auth.tenantId,
          runId: grant.runId,
          toolName: grant.toolName,
          approvalId: grant.approvalId,
          nonce: grant.nonce
        },
        { expiresIn: '3m' }
      ),
      approvalId: grant.approvalId,
      toolName: grant.toolName
    }
  }
}
