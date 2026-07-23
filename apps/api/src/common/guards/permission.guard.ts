import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { hasAllPermissions, hasAnyPermission } from '@zen/shared'

import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permission.decorator'

import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'
import type { RequirePermissionsMeta } from '../decorators/require-permission.decorator'
import type { JwtPayload } from '../interfaces/jwt-payload.interface'

type HttpRequest = {
  user?: JwtPayload
  auth?: AuthContext
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (isPublic) return true

    const meta = this.reflector.getAllAndOverride<RequirePermissionsMeta | undefined>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!meta || meta.codes.length === 0) return true

    const request = context.switchToHttp().getRequest<HttpRequest>()
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
}
