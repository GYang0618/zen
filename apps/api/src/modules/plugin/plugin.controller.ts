import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { PermissionCode } from '@zen/shared'

import { RequirePermission } from '@/common/decorators/require-permission.decorator'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '@/common/swagger'

import { PluginService } from './plugin.service'

import type { PluginListItemResponse, PluginListResponse } from './responses/plugin.response'

@ApiTags('插件管理')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('plugins')
export class PluginController {
  constructor(@Inject(PluginService) private readonly pluginService: PluginService) {}

  @Get()
  @RequirePermission(PermissionCode.PLUGIN_LIST)
  @ApiOperation({ summary: '列出编译期插件与安装状态' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  list(): Promise<PluginListResponse> {
    return this.pluginService.list()
  }

  @Get('active-ids')
  @ApiOperation({ summary: '当前租户已启用插件 ID（供前端菜单过滤）' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  async activeIds(): Promise<{ ids: string[] }> {
    const active = await this.pluginService.listActiveRegistryEntries()
    return { ids: active.map((item) => item.id) }
  }

  @Post(':id/activate')
  @RequirePermission(PermissionCode.PLUGIN_MANAGE)
  @ApiOperation({ summary: '启用插件' })
  @ApiParam({ name: 'id', description: '插件 ID' })
  @ApiOkResponse({ description: '启用成功' })
  @ApiStandardErrorResponses()
  activate(@Param('id') id: string): Promise<PluginListItemResponse> {
    return this.pluginService.activate(id)
  }

  @Post(':id/deactivate')
  @RequirePermission(PermissionCode.PLUGIN_MANAGE)
  @ApiOperation({ summary: '停用插件' })
  @ApiParam({ name: 'id', description: '插件 ID' })
  @ApiOkResponse({ description: '停用成功' })
  @ApiStandardErrorResponses()
  deactivate(@Param('id') id: string): Promise<PluginListItemResponse> {
    return this.pluginService.deactivate(id)
  }

  @Patch(':id/config')
  @RequirePermission(PermissionCode.PLUGIN_MANAGE)
  @ApiOperation({ summary: '更新插件配置（含 Feature Flag）' })
  @ApiParam({ name: 'id', description: '插件 ID' })
  @ApiOkResponse({ description: '更新成功' })
  @ApiStandardErrorResponses()
  updateConfig(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>
  ): Promise<PluginListItemResponse> {
    return this.pluginService.updateConfig(id, body ?? {})
  }
}
