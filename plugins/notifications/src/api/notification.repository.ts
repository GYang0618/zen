import { Inject, Injectable } from '@nestjs/common'

import { NOTIFICATIONS_PRISMA } from './tokens'

import type { PrismaClient } from '@prisma/client'

type NotificationRecord = {
  id: string
  tenantId: string
  userId: string
  title: string
  body: string | null
  readAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/** Notification 模型定义于平台 schema，插件包内 PrismaClient 类型未包含，故用委托桥接 */
type NotificationDelegate = {
  findMany: (args: {
    where: { tenantId: string; userId: string }
    orderBy: { createdAt: 'desc' }
  }) => Promise<NotificationRecord[]>
  findFirst: (args: {
    where: { id: string; tenantId: string }
  }) => Promise<NotificationRecord | null>
  create: (args: {
    data: {
      tenantId: string
      userId: string
      title: string
      body: string | null
    }
  }) => Promise<NotificationRecord>
  update: (args: { where: { id: string }; data: { readAt: Date } }) => Promise<NotificationRecord>
}

@Injectable()
export class NotificationRepository {
  private readonly notification: NotificationDelegate

  constructor(@Inject(NOTIFICATIONS_PRISMA) prisma: PrismaClient) {
    this.notification = (prisma as unknown as { notification: NotificationDelegate }).notification
  }

  findManyByUser(tenantId: string, userId: string) {
    return this.notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  findById(id: string, tenantId: string) {
    return this.notification.findFirst({
      where: { id, tenantId }
    })
  }

  create(data: { tenantId: string; userId: string; title: string; body?: string | null }) {
    return this.notification.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        title: data.title,
        body: data.body ?? null
      }
    })
  }

  markRead(id: string) {
    return this.notification.update({
      where: { id },
      data: { readAt: new Date() }
    })
  }
}
