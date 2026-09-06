import { HealthService } from './health.service.js'

describe('HealthService', () => {
  it('依赖就绪时返回 ok 与探活结果', async () => {
    const prisma = { $queryRaw: async () => [{ '?column?': 1 }] }
    const storage = { healthCheck: async () => undefined }
    const service = new HealthService(prisma as never, storage as never)
    const result = await service.getStatus()

    expect(result.status).toBe('ok')
    expect(result.database).toBe('ok')
    expect(result.storage).toBe('ok')
    expect(typeof result.timestamp).toBe('string')
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false)
  })

  it('依赖缺失时返回 degraded', async () => {
    const service = new HealthService()
    const result = await service.getStatus()
    expect(result.status).toBe('degraded')
    expect(result.database).toBe('error')
    expect(result.storage).toBe('error')
  })
})
