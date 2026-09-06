import { NotFoundException } from '@nestjs/common'

import { UserService } from './user.service.js'

const { jest } = import.meta

describe('UserService domain reads', () => {
  function createService() {
    const userRepo = {
      findActiveBasicInfoById: jest.fn().mockResolvedValue(null),
      ensureDomainData: jest.fn(),
      findActiveWithDomainById: jest.fn()
    }
    const storageService = { resolveAvatarUrl: jest.fn() }
    const service = new UserService(
      userRepo as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { expiresIn: '15m' } as never,
      storageService as never
    )
    return { service, userRepo }
  }

  it('returns 404 before creating domain rows for an unknown user detail', async () => {
    const { service, userRepo } = createService()

    await expect(service.getUserById('missing-user')).rejects.toBeInstanceOf(NotFoundException)
    expect(userRepo.ensureDomainData).not.toHaveBeenCalled()
  })

  it('returns 404 before creating domain rows for an unknown profile', async () => {
    const { service, userRepo } = createService()

    await expect(service.getUserInfoByUserId('missing-user')).rejects.toBeInstanceOf(
      NotFoundException
    )
    expect(userRepo.ensureDomainData).not.toHaveBeenCalled()
  })
})
