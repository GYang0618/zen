import { randomUUID } from 'node:crypto'

import {
  CopilotRuntime,
  createCopilotExpressHandler,
  InMemoryAgentRunner,
  ɵGLOBAL_STORE
} from '@copilotkit/runtime/v2'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { AuthContextService } from '../../common/auth/auth-context.service.js'
import { CONFIG_NAMESPACES } from '../../config/index.js'
import { defaultAgent, planAgent } from './agents.js'
import { CopilotThreadService } from './copilot-thread.service.js'
import { extractBearerToken } from './copilot-token.util.js'

import type { AgentFactoryContext } from '@copilotkit/runtime/v2'
import type { OnModuleInit } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface.js'
import type { AppConfig, LanggraphConfig } from '../../config/index.js'
import type { ThreadMessage } from './copilot-thread.service.js'

export function copilotKitBasePath(apiPrefix: string): string {
  const prefix = apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`
  return `${prefix.replace(/\/$/, '')}/copilot`
}

@Injectable()
export class CopilotService implements OnModuleInit {
  private readonly logger = new Logger(CopilotService.name)
  private handler!: ReturnType<typeof createCopilotExpressHandler>
  private readonly threadAuthMap = new Map<
    string,
    { tenantId: string; userId: string; agentId: string }
  >()

  constructor(
    @Inject(CONFIG_NAMESPACES.APP)
    private readonly appCfg: AppConfig,
    @Inject(CONFIG_NAMESPACES.LANGGRAPH)
    private readonly langgraphCfg: LanggraphConfig,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(AuthContextService)
    private readonly authContextService: AuthContextService,
    @Inject(CopilotThreadService)
    private readonly threadService: CopilotThreadService
  ) {}

  onModuleInit() {
    const { deploymentUrl } = this.langgraphCfg

    const runner = new InMemoryAgentRunner()

    const baseOptions = {
      runner,
      agents: async ({ request }: AgentFactoryContext) => {
        const token = extractBearerToken(request.headers)
        let auth: Pick<AuthContext, 'tenantId' | 'userId' | 'permissions'> | undefined
        if (token) {
          try {
            const payload = this.jwtService.verify<JwtPayload>(token)
            if (payload.typ === 'access') {
              const fullAuth = await this.authContextService.resolve(payload.sub)
              auth = {
                tenantId: fullAuth.tenantId,
                userId: fullAuth.userId,
                permissions: fullAuth.permissions
              }
            }
          } catch {
            // 鉴权错误由 onBeforeHandler 统一拦截返回 401
          }
        }

        return {
          default: defaultAgent({
            deploymentUrl,
            accessToken: token ?? undefined,
            auth
          }),
          plan: planAgent({
            deploymentUrl,
            accessToken: token ?? undefined
          })
        }
      },
      a2ui: {
        defaultCatalogId: 'copilotkit://zen-catalog'
      },
      afterRequestMiddleware: async ({
        messages,
        threadId
      }: {
        messages?: ThreadMessage[]
        threadId?: string
      }) => {
        if (!threadId || !messages || messages.length === 0) return
        const authInfo = this.threadAuthMap.get(threadId)
        if (!authInfo) return

        await this.threadService.saveThreadSnapshot({
          threadId,
          tenantId: authInfo.tenantId,
          userId: authInfo.userId,
          agentId: authInfo.agentId,
          messages
        })
      }
    }

    const runtime = new CopilotRuntime(baseOptions)

    this.handler = createCopilotExpressHandler({
      runtime,
      basePath: copilotKitBasePath(this.appCfg.apiPrefix),
      cors: false,
      hooks: {
        onRequest: async ({ request }) => {
          if (request.method === 'OPTIONS') return
        },
        onBeforeHandler: async ({ request, route }) => {
          if (request.method === 'OPTIONS' || route.method === 'info') return
          const authHeader = request.headers.get('authorization')
          const token = extractBearerToken(request.headers)
          if (!authHeader?.startsWith('Bearer ') || !token) {
            throw new Response(
              JSON.stringify({ error: 'unauthorized', message: '请先登录后访问 Agent 运行时' }),
              { status: 401, headers: { 'content-type': 'application/json' } }
            )
          }

          let payload: JwtPayload
          try {
            payload = this.jwtService.verify<JwtPayload>(token)
            if (payload.typ && payload.typ !== 'access') {
              throw new Error('Invalid token type')
            }
          } catch {
            throw new Response(
              JSON.stringify({ error: 'invalid_token', message: '登录态已失效或过期' }),
              { status: 401, headers: { 'content-type': 'application/json' } }
            )
          }

          if (route.method === 'agent/run') {
            try {
              const fullAuth = await this.authContextService.resolve(payload.sub)
              const cloned = request.clone()
              const body = (await cloned.json()) as { threadId?: string }
              if (body.threadId) {
                this.threadAuthMap.set(body.threadId, {
                  tenantId: fullAuth.tenantId,
                  userId: fullAuth.userId,
                  agentId: ('agentId' in route ? (route.agentId as string) : undefined) ?? 'default'
                })
              }
            } catch {
              // 忽略解析失败
            }
          }

          if (route.method === 'agent/connect') {
            try {
              const cloned = request.clone()
              const body = (await cloned.json()) as { threadId?: string }
              if (body.threadId) {
                const existingStore = ɵGLOBAL_STORE.peek(body.threadId)
                if (!existingStore || existingStore.historicRuns.length === 0) {
                  const { messages } = await this.threadService.getThreadMessages({
                    threadId: body.threadId
                  })
                  if (messages && messages.length > 0) {
                    const store = ɵGLOBAL_STORE.getOrCreate(body.threadId)
                    if (store.historicRuns.length === 0) {
                      const runId = randomUUID()
                      const events = [
                        {
                          type: 'RUN_STARTED',
                          threadId: body.threadId,
                          runId,
                          input: {
                            threadId: body.threadId,
                            runId,
                            tools: [],
                            context: [],
                            messages
                          }
                        },
                        { type: 'MESSAGES_SNAPSHOT', messages },
                        {
                          type: 'RUN_FINISHED',
                          threadId: body.threadId,
                          runId
                        }
                      ]
                      ɵGLOBAL_STORE.appendRun(body.threadId, {
                        threadId: body.threadId,
                        runId,
                        agentId:
                          ('agentId' in route ? (route.agentId as string) : undefined) ?? 'default',
                        parentRunId: null,
                        events: events as unknown as Parameters<
                          typeof ɵGLOBAL_STORE.appendRun
                        >[1]['events'],
                        messages: messages as unknown as Parameters<
                          typeof ɵGLOBAL_STORE.appendRun
                        >[1]['messages'],
                        createdAt: Date.now()
                      })
                    }
                  }
                }
              }
            } catch {
              // 忽略历史灌入失败
            }
          }
        },
        onResponse: async ({ response, route }) => {
          if (route?.method === 'info') {
            try {
              const body = (await response.clone().json()) as {
                threadEndpoints?: { mutations?: boolean }
              }
              if (body && typeof body === 'object' && body.threadEndpoints) {
                body.threadEndpoints.mutations = true
                return new Response(JSON.stringify(body), {
                  status: response.status,
                  headers: response.headers
                })
              }
            } catch {
              // 忽略解析失败，返回原始响应
            }
          }
          return response
        },
        onError: async ({ error, route }) => {
          this.logger.error({ route: route?.method, err: error }, 'CopilotKit 执行异常')
        }
      }
    })
  }

  getHandler() {
    return this.handler
  }
}
