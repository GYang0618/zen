import { ForbiddenException } from '@nestjs/common'
import { PermissionCode } from '@zen/shared'

import { StorageService } from './storage.service.js'

import type { AuthContext, CreateUploadIntent } from '@zen/shared'

const { jest } = import.meta

function auth(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    tenantId: 'cmtenant00000000000000001',
    userId: 'u1',
    roles: ['user'],
    permissions: [],
    isAdmin: false,
    dataScope: 'self',
    orgIds: ['org1'],
    permVer: 1,
    ...overrides
  }
}

function createService() {
  const repo = {
    findSessionByIdempotency: jest.fn(),
    createIntent: jest.fn(),
    findById: jest.fn(),
    findByIdWithSessions: jest.fn(),
    list: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateSession: jest.fn(),
    findExpiredSessions: jest.fn(),
    findPurgeDue: jest.fn(),
    findReadyExpired: jest.fn(),
    updateUserAvatar: jest.fn()
  }
  const objectStorage = {
    presignPut: jest.fn().mockResolvedValue({
      url: 'http://localhost:9000/put',
      headers: { 'Content-Type': 'image/png' },
      method: 'PUT'
    }),
    presignGet: jest.fn(),
    head: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
  const audit = { write: jest.fn() }
  const storageConfig = {
    uploadUrlTtlSeconds: 300,
    downloadUrlTtlSeconds: 300
  }
  const service = new StorageService(
    repo as never,
    objectStorage as never,
    audit as never,
    storageConfig as never
  )
  return { service, repo, objectStorage, audit }
}

const avatarIntent: CreateUploadIntent = {
  purpose: 'avatar',
  originalName: 'a.png',
  mimeType: 'image/png',
  size: 128
}

describe('StorageService', () => {
  it('头像上传不要求 FILE_UPLOAD', async () => {
    const { service, repo } = createService()
    repo.createIntent.mockResolvedValue({
      id: 'file1',
      declaredMime: 'image/png',
      storageKey: 'tenants/t/avatar/2026/08/file1.png',
      sessions: [{ id: 's1', expiresAt: new Date(Date.now() + 60_000) }]
    })

    const result = await service.createIntent(avatarIntent, auth())
    expect(result.fileId).toBe('file1')
    expect(result.method).toBe('PUT')
  })

  it('附件上传缺少 FILE_UPLOAD 时 403', async () => {
    const { service } = createService()
    await expect(
      service.createIntent({ ...avatarIntent, purpose: 'attachment' }, auth())
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('幂等键命中已有会话时直接返回', async () => {
    const { service, repo } = createService()
    repo.findSessionByIdempotency.mockResolvedValue({
      id: 's1',
      expiresAt: new Date(Date.now() + 60_000),
      file: {
        id: 'file1',
        declaredMime: 'image/png',
        storageKey: 'k'
      }
    })

    const result = await service.createIntent(
      { ...avatarIntent, idempotencyKey: 'idem-key-1' },
      auth()
    )
    expect(result.fileId).toBe('file1')
    expect(repo.createIntent).not.toHaveBeenCalled()
  })

  it('管理员可上传附件', async () => {
    const { service, repo } = createService()
    repo.createIntent.mockResolvedValue({
      id: 'file2',
      declaredMime: 'application/pdf',
      storageKey: 'k',
      sessions: [{ id: 's2', expiresAt: new Date(Date.now() + 60_000) }]
    })
    await expect(
      service.createIntent(
        { ...avatarIntent, purpose: 'attachment', mimeType: 'application/pdf' },
        auth({ isAdmin: true })
      )
    ).resolves.toMatchObject({ fileId: 'file2' })
  })

  it('持有 FILE_UPLOAD 可上传附件', async () => {
    const { service, repo } = createService()
    repo.createIntent.mockResolvedValue({
      id: 'file3',
      declaredMime: 'application/pdf',
      storageKey: 'k',
      sessions: [{ id: 's3', expiresAt: new Date(Date.now() + 60_000) }]
    })
    await expect(
      service.createIntent(
        { ...avatarIntent, purpose: 'attachment', mimeType: 'application/pdf' },
        auth({ permissions: [PermissionCode.FILE_UPLOAD] })
      )
    ).resolves.toMatchObject({ fileId: 'file3' })
  })
})
