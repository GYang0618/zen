import { Inject, Injectable, Logger } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma'

const TOUCH_INTERVAL_MS = 60 * 1000
const TOUCH_CACHE_MAX = 500

/**
 * 把已认证请求记为用户活跃。内存节流，避免每个接口都写库。
 */
@Injectable()
export class UserActivityService {
  private readonly logger = new Logger(UserActivityService.name)
  private readonly lastTouchedAt = new Map<string, number>()

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async touch(userId: string, now = Date.now()): Promise<void> {
    const previous = this.lastTouchedAt.get(userId) ?? 0
    if (now - previous < TOUCH_INTERVAL_MS) return

    this.remember(userId, now)
    try {
      await this.persist(userId, new Date(now))
    } catch (error) {
      this.lastTouchedAt.delete(userId)
      this.logger.warn(
        `Failed to touch lastActiveAt for ${userId}: ${error instanceof Error ? error.message : error}`
      )
    }
  }

  private remember(userId: string, now: number) {
    this.lastTouchedAt.set(userId, now)
    if (this.lastTouchedAt.size <= TOUCH_CACHE_MAX) return
    const oldest = this.lastTouchedAt.keys().next().value
    if (oldest && oldest !== userId) this.lastTouchedAt.delete(oldest)
  }

  private persist(userId: string, lastActiveAt: Date) {
    return this.prisma.userAudit.upsert({
      where: { userId },
      create: { userId, lastActiveAt },
      update: { lastActiveAt }
    })
  }
}
