import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DEFAULT_TENANT_ID } from '@zen/shared'
import { randomUUID } from 'node:crypto'

import { FileRepository } from './file.repository'

import type { AuthContext } from '@zen/shared'
import type { CreateFileInput, StoredFileDto } from '../file.schema'

@Injectable()
export class FileService {
  constructor(@Inject(FileRepository) private readonly fileRepo: FileRepository) {}

  async list(auth: AuthContext): Promise<StoredFileDto[]> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const rows = await this.fileRepo.findManyByOwner(tenantId, auth.userId)
    return rows.map(toDto)
  }

  async create(input: CreateFileInput, auth: AuthContext): Promise<StoredFileDto> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const storageKey = input.storageKey ?? `local/${auth.userId}/${randomUUID()}-${input.filename}`

    const created = await this.fileRepo.create({
      tenantId,
      ownerId: auth.userId,
      filename: input.filename,
      mimeType: input.mimeType,
      size: input.size,
      storageKey
    })
    return toDto(created)
  }

  async remove(id: string, auth: AuthContext): Promise<StoredFileDto> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const existing = await this.fileRepo.findById(id, tenantId)
    if (!existing) throw new NotFoundException('文件不存在')
    if (existing.ownerId !== auth.userId) {
      throw new ForbiddenException('无权操作该文件')
    }

    const deleted = await this.fileRepo.softDelete(id)
    return toDto(deleted)
  }
}

function toDto(row: {
  id: string
  tenantId: string
  ownerId: string
  filename: string
  mimeType: string | null
  size: number
  storageKey: string
  createdAt: Date
  updatedAt: Date
}): StoredFileDto {
  return {
    id: row.id,
    tenantId: row.tenantId,
    ownerId: row.ownerId,
    filename: row.filename,
    mimeType: row.mimeType,
    size: row.size,
    storageKey: row.storageKey,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}
