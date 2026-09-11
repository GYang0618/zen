import {
  CopilotKitIntelligence,
  CopilotRuntime,
  createCopilotExpressHandler
} from '@copilotkit/runtime/v2'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { AuthContextService } from '../../common/auth/auth-context.service.js'
import { CONFIG_NAMESPACES } from '../../config/index.js'
import { defaultAgent, planAgent } from './agents.js'
import { extractBearerToken } from './copilot-token.util.js'

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

  constructor(
    @Inject(CONFIG_NAMESPACES.APP)
    private readonly appCfg: AppConfig,
    @Inject(CONFIG_NAMESPACES.LANGGRAPH)
    private readonly langgraphCfg: LanggraphConfig,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(AuthContextService)
    private readonly authContextService: AuthContextService
  ) {}

  onModuleInit() {
    const { deploymentUrl, intelligenceApiKey, intelligenceApiUrl, intelligenceWsUrl } =
      this.langgraphCfg

    const intelligence = new CopilotKitIntelligence({
      apiKey: intelligenceApiKey,
      apiUrl: intelligenceApiUrl,
      wsUrl: intelligenceWsUrl
    })

    const runtime = new CopilotRuntime({
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
      intelligence,
      a2ui: {
        defaultCatalogId: 'copilotkit://zen-catalog'
      },
      identifyUser: async (request) => {
        const token = extractBearerToken(request.headers)
        if (!token) return { id: 'anonymous', name: 'Anonymous' }
        try {
          const payload = this.jwtService.verify<JwtPayload>(token)
          return {
            id: payload.sub,
            name: payload.email
          }
        } catch {
          return { id: 'anonymous', name: 'Anonymous' }
        }
      },
      generateThreadNames: true
    })

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

          try {
            const payload = this.jwtService.verify<JwtPayload>(token)
            if (payload.typ && payload.typ !== 'access') {
              throw new Error('Invalid token type')
            }
          } catch {
            throw new Response(
              JSON.stringify({ error: 'invalid_token', message: '登录态已失效或过期' }),
              { status: 401, headers: { 'content-type': 'application/json' } }
            )
          }
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
