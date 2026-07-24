import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PluginInstallStatus } from '@prisma/client'
import { REQUIRE_PLUGIN_ID_KEY } from '@zen/plugin-sdk'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { PrismaService } from '@/infra/prisma'

import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

import type { CanActivate, ExecutionContext } from '@nestjs/common'

/**
 * 若 handler/class 声明了 RequirePlugin，则校验租户安装状态为 ACTIVE。
 * 停用后返回 404。
 */
@Injectable()
export class PluginActiveGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService
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

    const installation = await this.prisma.pluginInstallation.findUnique({
      where: {
        tenantId_pluginId: {
          tenantId: DEFAULT_TENANT_ID,
          pluginId
        }
      }
    })

    if (!installation || installation.status !== PluginInstallStatus.ACTIVE) {
      throw new NotFoundException(`插件未启用: ${pluginId}`)
    }

    return true
  }
}
