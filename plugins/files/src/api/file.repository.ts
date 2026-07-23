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

@Injectable()
export class FileRepository {
  constructor(@Inject(FILES_PRISMA) private readonly prisma: PrismaClient) {}

  findManyByOwner(tenantId: string, ownerId: string) {
    // StoredFile 模型定义于平台 schema，插件包内 Prisma 类型未包含，故经 any 桥接
    return (this.prisma as any).storedFile.findMany({
      where: { tenantId, ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    }) as Promise<StoredFileRecord[]>
  }

  findById(id: string, tenantId: string) {
    return (this.prisma as any).storedFile.findFirst({
      where: { id, tenantId, deletedAt: null }
    }) as Promise<StoredFileRecord | null>
  }

  create(data: {
    tenantId: string
    ownerId: string
    filename: string
    mimeType?: string | null
    size?: number
    storageKey: string
  }) {
    return (this.prisma as any).storedFile.create({
      data: {
        tenantId: data.tenantId,
        ownerId: data.ownerId,
        filename: data.filename,
        mimeType: data.mimeType ?? null,
        size: data.size ?? 0,
        storageKey: data.storageKey
      }
    }) as Promise<StoredFileRecord>
  }

  softDelete(id: string) {
    return (this.prisma as any).storedFile.update({
      where: { id },
      data: { deletedAt: new Date() }
    }) as Promise<StoredFileRecord>
  }
}
