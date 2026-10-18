import { AuditStatsService } from './audit-stats.service.js'

const { jest } = import.meta

function latencySums() {
  return {
    latencySumMs: 500n,
    latencyLt10Ms: 0,
    latency10To25Ms: 0,
    latency25To50Ms: 0,
    latency50To100Ms: 0,
    latency100To250Ms: 2,
    latency250To500Ms: 0,
    latency500To1000Ms: 0,
    latency1000To2500Ms: 0,
    latency2500To5000Ms: 0,
    latencyGte5000Ms: 0
  }
}

describe('AuditStatsService access trend', () => {
  it('returns hourly trend bins and fills intervals without traffic with zeros', async () => {
    const queryRaw = jest.fn().mockResolvedValue([
      {
        bucketStart: new Date('2026-10-17T00:00:00.000Z'),
        requestCount: 2n,
        errorCount: 1n,
        ...latencySums()
      },
      {
        bucketStart: new Date('2026-10-17T02:00:00.000Z'),
        requestCount: 3n,
        errorCount: 0n,
        ...latencySums()
      }
    ])
    const prisma = {
      apiAccessStat: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { count: 5, errorCount: 1, ...latencySums() }
        }),
        groupBy: jest
          .fn()
          .mockResolvedValueOnce([
            { callerType: 'USER', _sum: { count: 5, errorCount: 1, ...latencySums() } }
          ])
          .mockResolvedValueOnce([
            {
              method: 'GET',
              route: '/api/audit/access',
              _sum: { count: 5, errorCount: 1, ...latencySums() }
            }
          ])
      },
      $queryRaw: queryRaw
    }
    const service = new AuditStatsService(prisma as never)

    const result = await service.access('tenant-1', {
      startDate: '2026-10-17T00:00:00.000Z',
      endDate: '2026-10-17T03:00:00.000Z',
      days: 1,
      top: 10
    })

    expect(result.trendGranularity).toBe('hour')
    expect(result.trend).toHaveLength(3)
    expect(result.trend.map((item) => item.requestCount)).toEqual([2, 0, 3])
    expect(result.trend[0]).toMatchObject({ errorRate: 0.5, meanMs: 250 })
    expect(queryRaw).toHaveBeenCalledTimes(1)
  })
})
