import { Body, Controller, Get, Inject, Patch, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  DEFAULT_SITE_CONFIG,
  DEFAULT_TENANT_ID,
  PermissionCode,
  siteConfigSchema
} from '@zen/shared'

import { AuditService } from '@/common/auth/audit.service'
import { Public } from '@/common/decorators/public.decorator'
import { RequirePermission } from '@/common/decorators/require-permission.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '@/common/swagger'
import { PrismaService } from '@/infra/prisma'

import type { SiteConfig } from '@zen/shared'

@ApiTags('系统配置')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('system/config')
export class ConfigController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: '公开站点配置（启动拉取）' })
  @ApiOkResponse({ description: '查询成功' })
  async getPublic(): Promise<Pick<SiteConfig, 'siteName' | 'logoUrl' | 'featureFlags'>> {
    const config = await this.readConfig()
    return {
      siteName: config.siteName,
      logoUrl: config.logoUrl ?? null,
      featureFlags: config.featureFlags
    }
  }

  @Get()
  @RequirePermission(PermissionCode.CONFIG_LIST)
  @ApiOperation({ summary: '获取站点配置' })
  @ApiStandardErrorResponses()
  async get(): Promise<SiteConfig> {
    return this.readConfig()
  }

  @Patch()
  @RequirePermission(PermissionCode.CONFIG_MANAGE)
  @ApiOperation({ summary: '更新站点配置' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(siteConfigSchema.partial()))
  async update(@Body() payload: Partial<SiteConfig>): Promise<SiteConfig> {
    const current = await this.readConfig()
    const next = siteConfigSchema.parse({ ...current, ...payload })
    await this.prisma.tenant.update({
      where: { id: DEFAULT_TENANT_ID },
      data: {
        settings: {
          ...(await this.readRawSettings()),
          siteConfig: next
        }
      }
    })
    await this.auditService.write({
      action: 'system.config.updated',
      resource: 'tenant',
      resourceId: DEFAULT_TENANT_ID,
      diff: payload
    })
    return next
  }

  private async readRawSettings(): Promise<Record<string, unknown>> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: DEFAULT_TENANT_ID } })
    if (
      !tenant?.settings ||
      typeof tenant.settings !== 'object' ||
      Array.isArray(tenant.settings)
    ) {
      return {}
    }
    return tenant.settings as Record<string, unknown>
  }

  private async readConfig(): Promise<SiteConfig> {
    const settings = await this.readRawSettings()
    const parsed = siteConfigSchema.safeParse(settings.siteConfig ?? {})
    return parsed.success ? parsed.data : DEFAULT_SITE_CONFIG
  }
}
