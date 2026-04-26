import type {
  CanActivate,
  ExecutionContext,
} from '@nestjs/common'
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'

import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

import type { JwtPayload } from '../interfaces/jwt-payload.interface'

type HttpRequest = {
  user?: JwtPayload
  headers: Record<string, string | string[] | undefined>
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(Reflector) private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) return true

    const request = context.switchToHttp().getRequest<HttpRequest>()
    const token = this.extractToken(request)

    if (!token) {
      throw new UnauthorizedException('缺少认证令牌')
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token)
      if (payload.typ && payload.typ !== 'access') {
        throw new UnauthorizedException('令牌类型无效')
      }
      request.user = payload
    } catch (error) {
      this.logger.warn(
        `Token verification failed: ${error instanceof Error ? error.message : error}`
      )
      throw new UnauthorizedException('令牌无效或已过期')
    }

    return true
  }

  private extractToken(request: HttpRequest): string | undefined {
    const authHeader = request.headers.authorization
    const authorization = Array.isArray(authHeader) ? authHeader[0] : authHeader
    const [type, token] = authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
