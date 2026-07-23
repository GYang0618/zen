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

@Injectable()
export class NotificationRepository {
  constructor(@Inject(NOTIFICATIONS_PRISMA) private readonly prisma: PrismaClient) {}

  findManyByUser(tenantId: string, userId: string) {
    // Notification 模型定义于平台 schema，插件包内 Prisma 类型未包含，故经 any 桥接
    return (this.prisma as any).notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' }
    }) as Promise<NotificationRecord[]>
  }

  findById(id: string, tenantId: string) {
    return (this.prisma as any).notification.findFirst({
      where: { id, tenantId }
    }) as Promise<NotificationRecord | null>
  }

  create(data: { tenantId: string; userId: string; title: string; body?: string | null }) {
    return (this.prisma as any).notification.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        title: data.title,
        body: data.body ?? null
      }
    }) as Promise<NotificationRecord>
  }

  markRead(id: string) {
    return (this.prisma as any).notification.update({
      where: { id },
      data: { readAt: new Date() }
    }) as Promise<NotificationRecord>
  }
}
