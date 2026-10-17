import {
  CopilotRuntime,
  createCopilotExpressHandler,
  InMemoryAgentRunner,
  ɵGLOBAL_STORE
} from '@copilotkit/runtime/v2'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AgentEndReason, AgentRunStatus } from '@prisma/client'
import {
  A2UI_SURFACE_TOOL_NAME,
  createAuditDiff,
  DEFAULT_AGENT_ID,
  DEFAULT_AGENT_RUN_BUDGET,
  getZenA2uiInlineCatalog,
  PAGE_AGENT_ID,
  ZEN_A2UI_CATALOG_ID
} from '@zen/shared'

import { AuditService } from '../../common/auth/audit.service.js'
import { AuthContextService } from '../../common/auth/auth-context.service.js'
import { CONFIG_NAMESPACES } from '../../config/index.js'
import { PrismaService } from '../../infra/prisma/index.js'
import { defaultAgent, pageAgent } from './agents.js'
import { stampMissingEventTimestamps } from './agui-message-timing.js'
import { CopilotThreadService } from './copilot-thread.service.js'
import { extractBearerToken } from './copilot-token.util.js'
import { CopilotUsageService } from './copilot-usage.service.js'
import {
  parseCopilotSseResponse,
  rewriteRunRequestWithoutDisplayMessages
} from './parse-copilot-sse-messages.js'
import {
  buildHistoryReplaySse,
  CONNECT_THREAD_HEADER,
  filterRegressiveSnapshotStream,
  stampConnectThreadRequest
} from './thread-history-replay.js'

import type { AgentFactoryContext } from '@copilotkit/runtime/v2'
import type { OnModuleInit } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface.js'
import type { AppConfig, LanggraphConfig } from '../../config/index.js'

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
    private readonly threadService: CopilotThreadService,
    @Inject(CopilotUsageService)
    private readonly usageService: CopilotUsageService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService
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
          [DEFAULT_AGENT_ID]: defaultAgent({
            deploymentUrl,
            accessToken: token ?? undefined,
            auth
          }),
          [PAGE_AGENT_ID]: pageAgent({
            deploymentUrl,
            accessToken: token ?? undefined
          })
        }
      },
      a2ui: {
        agents: [DEFAULT_AGENT_ID],
        injectA2UITool: true,
        a2uiToolNames: [A2UI_SURFACE_TOOL_NAME],
        defaultCatalogId: ZEN_A2UI_CATALOG_ID,
        schema: getZenA2uiInlineCatalog()
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

              // 预检 AI 配额
              const quota = await this.usageService.checkQuota(fullAuth.tenantId, fullAuth.userId)
              if (!quota.allowed) {
                throw new Response(
                  JSON.stringify({
                    error: 'ai_quota_exceeded',
                    message: quota.reason ?? 'AI 配额已用尽'
                  }),
                  { status: 429, headers: { 'content-type': 'application/json' } }
                )
              }

              const body = (await request.clone().json()) as {
                threadId?: string
                runId?: string
                messages?: Array<{ role: string }>
              }
              if (body.threadId) {
                this.threadAuthMap.set(body.threadId, {
                  tenantId: fullAuth.tenantId,
                  userId: fullAuth.userId,
                  agentId: route.agentId
                })
              }

              if (body.runId && body.threadId) {
                const user = await this.prisma.user.findUnique({
                  where: { id: fullAuth.userId },
                  select: {
                    profile: { select: { realName: true } },
                    nickname: true,
                    username: true
                  }
                })
                const userName = user?.profile?.realName ?? user?.nickname ?? user?.username ?? null

                await this.prisma.agentRun.upsert({
                  where: { id: body.runId },
                  update: {
                    status: 'running',
                    updatedAt: new Date()
                  },
                  create: {
                    id: body.runId,
                    threadId: body.threadId,
                    tenantId: fullAuth.tenantId,
                    userId: fullAuth.userId,
                    userName,
                    agentId: route.agentId,
                    status: 'running',
                    budget: DEFAULT_AGENT_RUN_BUDGET as unknown as object,
                    startedAt: new Date()
                  }
                })
              }

              return rewriteRunRequestWithoutDisplayMessages(request, body)
            } catch (err) {
              if (err instanceof Response) throw err
              // 忽略其他解析失败
            }
          }

          if (route.method === 'agent/connect') {
            try {
              return await stampConnectThreadRequest(request)
            } catch (error) {
              this.logger.error({ err: error }, '标记 connect 会话失败')
            }
          }
        },
        onResponse: async ({ request, response, route }) => {
          if (route?.method === 'agent/run') {
            const stamped = stampMissingEventTimestamps(response)
            void this.persistThreadSnapshotFromSse(stamped.clone())
            return this.guardSnapshotStream(stamped)
          }
          if (route?.method === 'agent/connect') {
            return this.replayStoredHistory(request, response)
          }
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

  private guardSnapshotStream(response: Response): Response {
    if (!response.body) return response
    const headers = new Headers(response.headers)
    headers.delete('content-length')
    return new Response(filterRegressiveSnapshotStream(response.body), {
      status: response.status,
      headers
    })
  }

  private async replayStoredHistory(request: Request, response: Response): Promise<Response> {
    const threadId = request.headers.get(CONNECT_THREAD_HEADER)
    if (!threadId) return response

    try {
      const store = ɵGLOBAL_STORE.peek(threadId)
      const busy = Boolean(store?.isRunning || store?.stopRequested)
      const { messages } = await this.threadService.getThreadMessages({ threadId })
      if (!busy && messages.length > 0) {
        const sse = buildHistoryReplaySse(threadId, messages)
        if (sse) {
          await response.body?.cancel().catch(() => undefined)
          const headers = new Headers(response.headers)
          headers.delete('content-length')
          headers.set('content-type', 'text/event-stream; charset=utf-8')
          return new Response(sse, { status: response.status, headers })
        }
      }
      if (busy && response.body) {
        const headers = new Headers(response.headers)
        headers.delete('content-length')
        return new Response(filterRegressiveSnapshotStream(response.body, messages), {
          status: response.status,
          headers
        })
      }
    } catch (error) {
      this.logger.error({ err: error, threadId }, '回放已保存的会话历史失败')
    }
    return response
  }

  private async persistThreadSnapshotFromSse(response: Response): Promise<void> {
    try {
      const { threadId, runId, status, endReason, messages, authoritative } =
        await parseCopilotSseResponse(response)

      if (threadId && messages.length > 0) {
        const authInfo = this.threadAuthMap.get(threadId)
        if (authInfo) {
          await this.threadService.saveThreadSnapshot({
            threadId,
            tenantId: authInfo.tenantId,
            userId: authInfo.userId,
            agentId: authInfo.agentId,
            messages,
            mode: authoritative ? 'replace' : 'append'
          })
        }
      }

      if (runId) {
        const finalStatus =
          status === 'failed'
            ? AgentRunStatus.failed
            : status === 'aborted'
              ? AgentRunStatus.cancelled
              : AgentRunStatus.succeeded
        const finalEndReason =
          endReason === 'aborted'
            ? AgentEndReason.cancelled
            : endReason === 'error'
              ? AgentEndReason.model_error
              : AgentEndReason.completed
        const existing = await this.prisma.agentRun.findUnique({ where: { id: runId } })
        const now = new Date()
        const durationMs = existing?.startedAt ? now.getTime() - existing.startedAt.getTime() : null

        await this.prisma.agentRun.updateMany({
          where: { id: runId },
          data: {
            status: finalStatus,
            endReason: finalEndReason,
            endedAt: now,
            durationMs: durationMs ?? undefined
          }
        })

        if (finalStatus === AgentRunStatus.failed) {
          this.auditService.enqueue({
            tenantId: existing?.tenantId,
            actorId: existing?.userId,
            action: 'agent.run.failed',
            resource: 'agent_run',
            resourceId: runId,
            result: 'FAILURE',
            diff: createAuditDiff({
              summary: `AI 任务执行失败${endReason ? `：${endReason}` : ''}`,
              meta: { endReason, status }
            })
          })
        }
      }
    } catch (error) {
      this.logger.error({ err: error }, '从 SSE 持久化会话快照与 Run 状态失败')
    }
  }

  getHandler() {
    return this.handler
  }
}
