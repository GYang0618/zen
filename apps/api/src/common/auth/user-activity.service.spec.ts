import { UserActivityService } from './user-activity.service.js'

import type { PrismaService } from '../../infra/prisma/index.js'

const { jest } = import.meta

const MINUTE = 60 * 1000

function createService() {
  const upsert = jest.fn().mockResolvedValue({})
  const prisma = { userAudit: { upsert } } as unknown as PrismaService
  return { service: new UserActivityService(prisma), upsert }
}

describe('UserActivityService', () => {
  it('writes lastActiveAt on the first authenticated touch', async () => {
    const { service, upsert } = createService()
    const now = Date.parse('2026-08-19T07:00:00.000Z')

    await service.touch('user-1', now)

    expect(upsert).toHaveBeenCalledTimes(1)
    expect(upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: { userId: 'user-1', lastActiveAt: new Date(now) },
      update: { lastActiveAt: new Date(now) }
    })
  })

  it('skips writes within the one-minute throttle window', async () => {
    const { service, upsert } = createService()
    const now = Date.parse('2026-08-19T07:00:00.000Z')

    await service.touch('user-1', now)
    await service.touch('user-1', now + MINUTE - 1)

    expect(upsert).toHaveBeenCalledTimes(1)
  })

  it('writes again after the throttle window elapses', async () => {
    const { service, upsert } = createService()
    const now = Date.parse('2026-08-19T07:00:00.000Z')

    await service.touch('user-1', now)
    await service.touch('user-1', now + MINUTE)

    expect(upsert).toHaveBeenCalledTimes(2)
  })

  it('allows a retry when persistence fails', async () => {
    const { service, upsert } = createService()
    const now = Date.parse('2026-08-19T07:00:00.000Z')
    upsert.mockRejectedValueOnce(new Error('db unavailable'))

    await service.touch('user-1', now)
    await service.touch('user-1', now + 1)

    expect(upsert).toHaveBeenCalledTimes(2)
  })
})
