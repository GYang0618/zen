import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '../../infra/prisma/index.js'

import type { FileAsset, Prisma, UploadSession } from '@prisma/client'
import type { FilePurpose, FileStatus } from '@zen/shared'

@Injectable()
export class StorageRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  createIntent(data: {
    file: Prisma.FileAssetUncheckedCreateInput
    session: Prisma.UploadSessionUncheckedCreateWithoutFileInput
  }) {
    return this.prisma.fileAsset.create({
      data: {
        ...data.file,
        sessions: { create: data.session }
      },
      include: { sessions: true }
    })
  }

  findSessionByIdempotency(tenantId: string, idempotencyKey: string) {
    return this.prisma.uploadSession.findFirst({
      where: { tenantId, idempotencyKey },
      include: { file: true }
    })
  }

  findActiveBySourceChecksum(input: {
    tenantId: string
    ownerId: string
    purpose: string
    organizationId: string | null
    sourceSha256: string
    size: number
  }) {
    return this.prisma.fileAsset.findFirst({
      where: {
        tenantId: input.tenantId,
        ownerId: input.ownerId,
        purpose: input.purpose,
        organizationId: input.organizationId,
        deletedAt: null,
        status: { in: ['pending', 'uploaded', 'ready'] },
        OR: [
          { sourceSha256: input.sourceSha256 },
          // 旧数据没有 sourceSha256。仅当体积未变时，sha256 才等于用户所选原文件。
          {
            sourceSha256: null,
            sha256: input.sourceSha256,
            size: input.size,
            status: 'ready'
          }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: { sessions: { orderBy: { createdAt: 'desc' }, take: 1 } }
    })
  }

  findReadyByObjectHash(input: {
    tenantId: string
    ownerId: string
    purpose: string
    organizationId: string | null
    sha256: string
    excludeId: string
  }) {
    return this.prisma.fileAsset.findFirst({
      where: {
        tenantId: input.tenantId,
        ownerId: input.ownerId,
        purpose: input.purpose,
        organizationId: input.organizationId,
        sha256: input.sha256,
        status: 'ready',
        deletedAt: null,
        id: { not: input.excludeId }
      },
      orderBy: { createdAt: 'asc' }
    })
  }

  findById(tenantId: string, id: string, extra: Prisma.FileAssetWhereInput = {}) {
    return this.prisma.fileAsset.findFirst({
      where: { id, tenantId, ...extra }
    })
  }

  findByIdWithSessions(tenantId: string, id: string) {
    return this.prisma.fileAsset.findFirst({
      where: { id, tenantId },
      include: { sessions: { orderBy: { createdAt: 'desc' }, take: 1 } }
    })
  }

  list(args: { where: Prisma.FileAssetWhereInput; skip: number; take: number }) {
    return this.prisma.fileAsset.findMany({
      where: args.where,
      orderBy: { createdAt: 'desc' },
      skip: args.skip,
      take: args.take
    })
  }

  count(where: Prisma.FileAssetWhereInput) {
    return this.prisma.fileAsset.count({ where })
  }

  update(id: string, data: Prisma.FileAssetUpdateInput) {
    return this.prisma.fileAsset.update({ where: { id }, data })
  }

  updateSession(id: string, data: Prisma.UploadSessionUpdateInput) {
    return this.prisma.uploadSession.update({ where: { id }, data })
  }

  findExpiredSessions(now: Date) {
    return this.prisma.uploadSession.findMany({
      where: { status: 'pending', expiresAt: { lte: now } },
      include: { file: true },
      take: 100
    })
  }

  findPurgeDue(now: Date) {
    return this.prisma.fileAsset.findMany({
      where: {
        status: { in: ['deleted', 'pending'] },
        OR: [{ purgeAfter: { lte: now } }, { expiresAt: { lte: now } }]
      },
      take: 100
    })
  }

  findReadyExpired(now: Date) {
    return this.prisma.fileAsset.findMany({
      where: { status: 'ready', expiresAt: { lte: now } },
      take: 100
    })
  }

  updateUserAvatar(userId: string, avatar: string | null) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, avatar },
      update: { avatar }
    })
  }
}

export type FileAssetRow = FileAsset
export type UploadSessionRow = UploadSession
export type { FilePurpose, FileStatus }
