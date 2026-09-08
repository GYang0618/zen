import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { REQUIRE_PLUGIN_ID_KEY } from '@zen/plugin-sdk'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { TenantPluginStateService } from '../../modules/plugin/tenant-plugin-state.service.js'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js'

import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'

type AuthedRequest = {
  auth?: AuthContext
}

/**
 * 若 handler/class 声明了 RequirePlugin，则校验租户安装状态为 ACTIVE。
 * 停用或缺少安装记录时返回 404（fail-closed）。
 */
@Injectable()
export class PluginActiveGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(TenantPluginStateService) private readonly pluginState: TenantPluginStateService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (isPublic) return true

    const pluginId = this.reflector.getAllAndOverride<string | undefined>(REQUIRE_PLUGIN_ID_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (!pluginId) return true

    const request = context.switchToHttp().getRequest<AuthedRequest>()
    const tenantId = request.auth?.tenantId ?? DEFAULT_TENANT_ID
    const active = await this.pluginState.isActive(pluginId, tenantId)
    if (!active) {
      throw new NotFoundException(`插件未启用: ${pluginId}`)
    }

    return true
  }
}
