import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { hasAllPermissions, hasAnyPermission } from '@zen/shared'

import { ALLOW_AUTHENTICATED_KEY } from '../decorators/allow-authenticated.decorator'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permission.decorator'

import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'
import type { RequirePermissionsMeta } from '../decorators/require-permission.decorator'
import type { JwtPayload } from '../interfaces/jwt-payload.interface'

type HttpRequest = {
  method?: string
  user?: JwtPayload
  auth?: AuthContext
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<HttpRequest>()
    if (request.auth?.isAdmin) return true

    const meta = this.reflector.getAllAndOverride<RequirePermissionsMeta | undefined>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (meta && meta.codes.length > 0) {
      const granted = request.auth?.permissions ?? []
      const allowed =
        meta.mode === 'any'
          ? hasAnyPermission(granted, meta.codes)
          : hasAllPermissions(granted, meta.codes)

      if (!allowed) {
        throw new ForbiddenException(`缺少权限: ${meta.codes.join(', ')}`)
      }
      return true
    }

    const allowAuthenticated = this.reflector.getAllAndOverride<boolean>(ALLOW_AUTHENTICATED_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (allowAuthenticated) return true

    const method = (request.method ?? 'GET').toUpperCase()
    if (WRITE_METHODS.has(method)) {
      throw new ForbiddenException('接口未配置权限')
    }

    return true
  }
}
