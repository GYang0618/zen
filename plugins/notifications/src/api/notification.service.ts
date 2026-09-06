import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { NotificationRepository } from './notification.repository.js'

import type { AuthContext } from '@zen/shared'
import type { CreateNotificationInput, NotificationDto } from '../notification.schema.js'

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NotificationRepository) private readonly notificationRepo: NotificationRepository
  ) {}

  async list(auth: AuthContext): Promise<NotificationDto[]> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const rows = await this.notificationRepo.findManyByUser(tenantId, auth.userId)
    return rows.map(toDto)
  }

  async create(input: CreateNotificationInput, auth: AuthContext): Promise<NotificationDto> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const targetUserId = input.userId ?? auth.userId

    const created = await this.notificationRepo.create({
      tenantId,
      userId: targetUserId,
      title: input.title,
      body: input.body
    })
    return toDto(created)
  }

  async markRead(id: string, auth: AuthContext): Promise<NotificationDto> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const existing = await this.notificationRepo.findById(id, tenantId)
    if (!existing) throw new NotFoundException('通知不存在')
    if (existing.userId !== auth.userId) {
      throw new ForbiddenException('无权操作该通知')
    }

    const updated = await this.notificationRepo.markRead(id)
    return toDto(updated)
  }
}

function toDto(row: {
  id: string
  tenantId: string
  userId: string
  title: string
  body: string | null
  readAt: Date | null
  createdAt: Date
  updatedAt: Date
}): NotificationDto {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    title: row.title,
    body: row.body,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}
