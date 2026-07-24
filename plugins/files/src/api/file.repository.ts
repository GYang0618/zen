import { Inject, Injectable } from '@nestjs/common'

import { FILES_PRISMA } from './tokens'

import type { PrismaClient } from '@prisma/client'

type StoredFileRecord = {
  id: string
  tenantId: string
  ownerId: string
  filename: string
  mimeType: string | null
  size: number
  storageKey: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

/** StoredFile 模型定义于平台 schema，插件包内 PrismaClient 类型未包含，故用委托桥接 */
type StoredFileDelegate = {
  findMany: (args: {
    where: { tenantId: string; ownerId: string; deletedAt: null }
    orderBy: { createdAt: 'desc' }
  }) => Promise<StoredFileRecord[]>
  findFirst: (args: {
    where: { id: string; tenantId: string; deletedAt: null }
  }) => Promise<StoredFileRecord | null>
  create: (args: {
    data: {
      tenantId: string
      ownerId: string
      filename: string
      mimeType: string | null
      size: number
      storageKey: string
    }
  }) => Promise<StoredFileRecord>
  update: (args: { where: { id: string }; data: { deletedAt: Date } }) => Promise<StoredFileRecord>
}

@Injectable()
export class FileRepository {
  private readonly storedFile: StoredFileDelegate

  constructor(@Inject(FILES_PRISMA) prisma: PrismaClient) {
    this.storedFile = (prisma as unknown as { storedFile: StoredFileDelegate }).storedFile
  }

  findManyByOwner(tenantId: string, ownerId: string) {
    return this.storedFile.findMany({
      where: { tenantId, ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    })
  }

  findById(id: string, tenantId: string) {
    return this.storedFile.findFirst({
      where: { id, tenantId, deletedAt: null }
    })
  }

  create(data: {
    tenantId: string
    ownerId: string
    filename: string
    mimeType?: string | null
    size?: number
    storageKey: string
  }) {
    return this.storedFile.create({
      data: {
        tenantId: data.tenantId,
        ownerId: data.ownerId,
        filename: data.filename,
        mimeType: data.mimeType ?? null,
        size: data.size ?? 0,
        storageKey: data.storageKey
      }
    })
  }

  softDelete(id: string) {
    return this.storedFile.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
  }
}
