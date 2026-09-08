import { Inject, Injectable } from '@nestjs/common'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/index.js'

@Injectable()
export class SessionService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  create(input: {
    userId: string
    refreshTokenHash: string
    expiresAt: Date
    tenantId?: string
    ip?: string | null
    userAgent?: string | null
  }) {
    return this.prisma.session.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId ?? DEFAULT_TENANT_ID,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null
      }
    })
  }

  listActiveByUser(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findActiveMatching(userId: string, verify: (refreshTokenHash: string) => Promise<boolean>) {
    const sessions = await this.listActiveByUser(userId)
    for (const session of sessions) {
      if (await verify(session.refreshTokenHash)) {
        return session
      }
    }
    return null
  }

  async revokeById(sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  }

  async revokeAllForUser(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  }
}
