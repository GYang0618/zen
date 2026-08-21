import { createReadStream, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'

import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { FileRepository } from './file.repository'

import type { ReadStream } from 'node:fs'
import type { AuthContext } from '@zen/shared'
import type { CreateFileInput, StoredFileDto } from '../file.schema'

const UPLOAD_ROOT = join(process.cwd(), 'uploads')

@Injectable()
export class FileService {
  constructor(@Inject(FileRepository) private readonly fileRepo: FileRepository) {
    if (!existsSync(UPLOAD_ROOT)) {
      mkdirSync(UPLOAD_ROOT, { recursive: true })
    }
  }

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

  async upload(
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    auth: AuthContext
  ): Promise<StoredFileDto> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const ext = file.originalname.includes('.') ? `.${file.originalname.split('.').pop()}` : ''
    const storageFilename = `${randomUUID()}${ext}`
    const userDir = join(UPLOAD_ROOT, auth.userId)

    if (!existsSync(userDir)) {
      mkdirSync(userDir, { recursive: true })
    }

    const filePath = join(userDir, storageFilename)
    await writeFile(filePath, file.buffer)

    const storageKey = `${auth.userId}/${storageFilename}`

    const created = await this.fileRepo.create({
      tenantId,
      ownerId: auth.userId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey
    })
    return toDto(created)
  }

  async getFileStream(
    id: string,
    auth: AuthContext
  ): Promise<{ stream: ReadStream; mimeType: string | null; filename: string }> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const record = await this.fileRepo.findById(id, tenantId)
    if (!record) throw new NotFoundException('文件不存在')

    const filePath = join(UPLOAD_ROOT, record.storageKey)
    if (!existsSync(filePath)) throw new NotFoundException('文件内容不存在')

    return {
      stream: createReadStream(filePath),
      mimeType: record.mimeType,
      filename: record.filename
    }
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
    url: `/files/${row.id}/download`,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}
