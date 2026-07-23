import { Injectable } from '@nestjs/common'

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now()

  async getStatus() {
    return {
      status: 'ok',
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
}
