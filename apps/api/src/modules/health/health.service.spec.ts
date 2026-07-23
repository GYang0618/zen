import { HealthService } from './health.service'

describe('HealthService', () => {
  it('返回 ok 状态与时间戳', async () => {
    const service = new HealthService()
    const result = await service.getStatus()

    expect(result.status).toBe('ok')
    expect(typeof result.timestamp).toBe('string')
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false)
  })
})
