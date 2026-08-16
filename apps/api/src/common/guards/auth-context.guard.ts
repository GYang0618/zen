import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { AuthContextService } from '../auth/auth-context.service'
import { setRequestAuditContext } from '../auth/request-audit-context'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { resolveTraceId } from '../utils/trace-id'

import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'
import type { JwtPayload } from '../interfaces/jwt-payload.interface'

type HttpRequest = {
  user?: JwtPayload
  auth?: AuthContext
  id?: string
  ip?: string
  headers: Record<string, string | string[] | undefined>
  get?: (name: string) => string | undefined
}

function readClientIp(request: HttpRequest): string | undefined {
  const forwarded = request.headers['x-forwarded-for']
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded
  if (typeof forwardedValue === 'string' && forwardedValue.trim()) {
    return forwardedValue.split(',')[0]?.trim()
  }
  return request.ip
}

/**
 * 在 AuthGuard 之后加载 AuthContext（tenantId、permissions、dataScope 等）到 request.auth
 * Access Token 的 permVer 与租户不一致时要求重新登录/刷新。
 */
@Injectable()
export class AuthContextGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthContextService) private readonly authContextService: AuthContextService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<HttpRequest>()
    if (!request.user?.sub) return true

    request.auth = await this.authContextService.resolve(request.user.sub)

    const tokenPermVer = request.user.permVer
    if (
      request.user.typ === 'access' &&
      typeof tokenPermVer === 'number' &&
      tokenPermVer !== request.auth.permVer
    ) {
      throw new UnauthorizedException('权限已变更，请重新登录')
    }

    setRequestAuditContext({
      actorId: request.auth.userId,
      tenantId: request.auth.tenantId,
      ip: readClientIp(request),
      userAgent: request.get?.('user-agent') ?? undefined,
      traceId: resolveTraceId({
        existingId: request.id,
        headers: request.headers
      })
    })

    return true
  }
}
