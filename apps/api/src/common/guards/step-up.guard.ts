import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'

import { REQUIRE_STEP_UP_KEY } from '@/common/decorators/require-step-up.decorator'
import { CONFIG_NAMESPACES } from '@/config'

import type { Request } from 'express'
import type { AuthConfig } from '@/config'

export type StepUpPayload = {
  sub: string
  typ: 'step-up'
  purpose: string
}

@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(CONFIG_NAMESPACES.AUTH) private readonly authCfg: AuthConfig
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_STEP_UP_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (!required) return true

    const request = context.switchToHttp().getRequest<Request & { user?: { sub?: string } }>()
    const token = request.header('x-step-up-token')
    if (!token) throw new ForbiddenException('需要二次确认')

    try {
      const payload = await this.jwtService.verifyAsync<StepUpPayload>(token, {
        secret: this.authCfg.secret
      })
      if (payload.typ !== 'step-up' || payload.sub !== request.user?.sub) {
        throw new ForbiddenException('二次确认令牌无效')
      }
      return true
    } catch {
      throw new ForbiddenException('二次确认令牌无效或已过期')
    }
  }
}
