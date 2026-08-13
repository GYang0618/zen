import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentAuth, RequirePermission, RequirePlugin, ZodValidationPipe } from '@zen/plugin-sdk/nest'

import { NOTIF_PERMISSIONS, NOTIFICATIONS_PLUGIN_ID } from '../constants'
import { createNotificationSchema } from '../notification.schema'
import { NotificationService } from './notification.service'

import type { AuthContext } from '@zen/shared'
import type { CreateNotificationInput, NotificationDto } from '../notification.schema'

@ApiTags('通知中心')
@ApiBearerAuth('access-token')
@RequirePlugin(NOTIFICATIONS_PLUGIN_ID)
@Controller('notifications')
export class NotificationController {
  constructor(
    @Inject(NotificationService) private readonly notificationService: NotificationService
  ) {}

  @Get()
  @RequirePermission(NOTIF_PERMISSIONS.LIST)
  @ApiOperation({ summary: '我的通知列表' })
  @ApiOkResponse({ description: '查询成功' })
  list(@CurrentAuth() auth: AuthContext): Promise<NotificationDto[]> {
    return this.notificationService.list(auth)
  }

  @Post()
  @RequirePermission(NOTIF_PERMISSIONS.MANAGE)
  @ApiOperation({ summary: '创建通知' })
  create(
    @Body(new ZodValidationPipe(createNotificationSchema)) body: CreateNotificationInput,
    @CurrentAuth() auth: AuthContext
  ): Promise<NotificationDto> {
    return this.notificationService.create(body, auth)
  }

  @Patch(':id/read')
  @RequirePermission(NOTIF_PERMISSIONS.LIST)
  @ApiOperation({ summary: '标记通知已读' })
  markRead(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<NotificationDto> {
    return this.notificationService.markRead(id, auth)
  }
}
