import { createParamDecorator, UnauthorizedException } from '@nestjs/common'

import type { ExecutionContext } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'

/**
 * 读取 AuthContextGuard 挂载的 request.auth
 */
export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const request = ctx.switchToHttp().getRequest<{ auth?: AuthContext }>()
    if (!request.auth) {
      throw new UnauthorizedException('缺少认证上下文')
    }
    return request.auth
  }
)
