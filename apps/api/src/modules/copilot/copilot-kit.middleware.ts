import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { AuthContextService } from '../../common/auth/auth-context.service.js'
import { setRequestAuditContext } from '../../common/auth/request-audit-context.js'
import { UserActivityService } from '../../common/auth/user-activity.service.js'
import { resolveTraceId } from '../../common/utils/trace-id.js'
import { CONFIG_NAMESPACES } from '../../config/index.js'
import { CopilotService } from './copilot.service.js'
import { extractBearerToken } from './copilot-token.util.js'

import type { NestMiddleware } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'
import type { NextFunction, Request, Response } from 'express'
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface.js'
import type { SecurityConfig } from '../../config/index.js'

type CopilotRequest = Request & { user?: JwtPayload; auth?: AuthContext; id?: string }

const throttleBuckets = new Map<string, { count: number; resetAt: number }>()

/**
 * 将 CopilotKit v2 Express adapter 挂为 Nest middleware。
 * 认证在 adapter 之前完成，避免 Controller catch-all 转发原始 req/res/next。
 */
@Injectable()
export class CopilotKitMiddleware implements NestMiddleware {
  constructor(
    @Inject(CopilotService) private readonly copilotService: CopilotService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(AuthContextService) private readonly authContextService: AuthContextService,
    @Inject(UserActivityService) private readonly userActivityService: UserActivityService,
    @Inject(CONFIG_NAMESPACES.SECURITY) private readonly securityCfg: SecurityConfig
  ) {}

  async use(req: CopilotRequest, res: Response, next: NextFunction): Promise<void> {
    if (isCopilotRuntimeLedgerPath(req)) {
      next()
      return
    }
    if (!this.allowCopilotRequest(req, res)) return

    const accessToken = extractBearerToken(req.headers)
    if (!accessToken) {
      res.status(401).json({ statusCode: 401, message: '缺少认证令牌' })
      return
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(accessToken)
      if (payload.typ && payload.typ !== 'access') {
        throw new UnauthorizedException('令牌类型无效')
      }
      req.user = payload
      req.auth = await this.authContextService.resolve(payload.sub)
      await this.userActivityService.touch(payload.sub)
      setRequestAuditContext({
        actorId: req.auth.userId,
        tenantId: req.auth.tenantId,
        ip: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
        traceId: resolveTraceId({ existingId: req.id, headers: req.headers })
      })
    } catch {
      res.status(401).json({ statusCode: 401, message: '令牌无效或已过期' })
      return
    }

    const body = req.body as { threadId?: unknown; runId?: unknown } | undefined
    const threadId = typeof body?.threadId === 'string' ? body.threadId : undefined
    const runId = typeof body?.runId === 'string' ? body.runId : undefined
    this.copilotService.prepareRequest(
      req,
      accessToken,
      { auth: req.auth, traceId: typeof req.id === 'string' ? req.id : undefined },
      threadId,
      runId
    )
    this.copilotService.getHandler()(req, res, next)
  }

  private allowCopilotRequest(req: CopilotRequest, res: Response): boolean {
    const { ttl, limit } = this.securityCfg.copilotThrottle
    const key = req.ip || 'anonymous'
    const now = Date.now()
    const bucket = throttleBuckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      throttleBuckets.set(key, { count: 1, resetAt: now + ttl })
      return true
    }
    if (bucket.count >= limit) {
      res.status(429).json({ statusCode: 429, message: 'Copilot 请求过于频繁' })
      return false
    }
    bucket.count += 1
    return true
  }
}

/** Default Agent 账本走 Nest Controller，不得被 CopilotKit adapter 吞掉。 */
export function isCopilotRuntimeLedgerPath(
  req: Pick<Request, 'path' | 'originalUrl' | 'baseUrl'>
): boolean {
  const path = `${req.baseUrl ?? ''}${req.path ?? ''} ${req.originalUrl ?? ''}`
  return /\/copilot\/runtime(?:\/|$|\?)/.test(path)
}
