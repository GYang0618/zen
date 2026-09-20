import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { AllowAuthenticated } from '../../common/decorators/allow-authenticated.decorator.js'
import { BypassTransform } from '../../common/decorators/bypass-transform.decorator.js'
import { CurrentAuth } from '../../common/decorators/current-auth.decorator.js'
import { ACCESS_TOKEN_AUTH } from '../../common/swagger/index.js'
import { CopilotThreadService } from './copilot-thread.service.js'
import { CopilotTitleService } from './copilot-title.service.js'

import type { AuthContext } from '@zen/shared'

/**
 * CopilotKit `useThreads` 直接消费原生 `{ threads, nextCursor }` 形态，
 * 不能走全局 TransformInterceptor 包装；写操作仅需登录态即可。
 */
@ApiTags('Copilot - 会话历史')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@AllowAuthenticated()
@BypassTransform()
@Controller('copilot/threads')
export class CopilotThreadController {
  constructor(
    @Inject(CopilotThreadService) private readonly threadService: CopilotThreadService,
    @Inject(CopilotTitleService) private readonly titleService: CopilotTitleService
  ) {}

  @ApiOperation({ summary: '获取当前用户的智能体会话列表' })
  @Get()
  async listThreads(
    @CurrentAuth() auth: AuthContext,
    @Query('agentId') agentId?: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ) {
    return this.threadService.listThreads({
      tenantId: auth.tenantId,
      userId: auth.userId,
      agentId,
      includeArchived: includeArchived === 'true',
      limit: limit ? Number(limit) : undefined,
      cursor
    })
  }

  @ApiOperation({ summary: '根据首条用户消息精炼会话标题并写回' })
  @Post(':threadId/generate-title')
  async generateTitle(
    @CurrentAuth() auth: AuthContext,
    @Param('threadId') threadId: string,
    @Body() body: { content?: string; agentId?: string }
  ) {
    return this.titleService.generateTitleFromContent({
      threadId,
      tenantId: auth.tenantId,
      userId: auth.userId,
      agentId: body.agentId ?? 'default',
      content: body.content ?? ''
    })
  }

  @ApiOperation({ summary: '重命名会话标题' })
  @Patch(':threadId')
  async updateThread(
    @CurrentAuth() auth: AuthContext,
    @Param('threadId') threadId: string,
    @Body() body: { name?: string }
  ) {
    return this.threadService.updateThread({
      threadId,
      tenantId: auth.tenantId,
      userId: auth.userId,
      name: body.name
    })
  }

  @ApiOperation({ summary: '归档会话' })
  @Post(':threadId/archive')
  async archiveThread(@CurrentAuth() auth: AuthContext, @Param('threadId') threadId: string) {
    return this.threadService.archiveThread({
      threadId,
      tenantId: auth.tenantId,
      userId: auth.userId
    })
  }

  @ApiOperation({ summary: '删除会话' })
  @Delete(':threadId')
  async deleteThread(@CurrentAuth() auth: AuthContext, @Param('threadId') threadId: string) {
    return this.threadService.deleteThread({
      threadId,
      tenantId: auth.tenantId,
      userId: auth.userId
    })
  }

  @ApiOperation({ summary: '获取指定会话的历史消息快照' })
  @Get(':threadId/messages')
  async getThreadMessages(@CurrentAuth() auth: AuthContext, @Param('threadId') threadId: string) {
    return this.threadService.getThreadMessages({
      threadId,
      tenantId: auth.tenantId,
      userId: auth.userId
    })
  }
}
