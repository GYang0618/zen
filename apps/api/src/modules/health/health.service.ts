import { Inject, Injectable, Optional } from '@nestjs/common'

import { PrismaService } from '../../infra/prisma/index.js'
import { StorageService } from '../storage/storage.service.js'

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now()

  constructor(
    @Optional() @Inject(PrismaService) private readonly prisma?: PrismaService,
    @Optional() @Inject(StorageService) private readonly storage?: StorageService
  ) {}

  async getStatus() {
    const [database, objectStorage] = await Promise.all([this.checkDatabase(), this.checkStorage()])
    const healthy = database === 'ok' && objectStorage === 'ok'
    return {
      status: healthy ? 'ok' : 'degraded',
      database,
      storage: objectStorage,
      timestamp: new Date().toISOString()
    }
  }

  async getMetrics() {
    const memory = process.memoryUsage()
    return {
      uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      timestamp: new Date().toISOString()
    }
  }

  private async checkDatabase(): Promise<'ok' | 'error'> {
    if (!this.prisma) return 'error'
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return 'ok'
    } catch {
      return 'error'
    }
  }

  private async checkStorage(): Promise<'ok' | 'error'> {
    if (!this.storage) return 'error'
    try {
      await this.storage.healthCheck()
      return 'ok'
    } catch {
      return 'error'
    }
  }
}
