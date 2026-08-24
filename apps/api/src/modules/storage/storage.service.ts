import { createHash, randomUUID } from 'node:crypto'

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_TENANT_ID,
  hasAllPermissions,
  PermissionCode,
  parseFileRef,
  resolveFileCategory,
  toFileRef
} from '@zen/shared'

import { applyFileDataScope } from '@/common/auth/apply-data-scope'
import { AuditService } from '@/common/auth/audit.service'
import { paginate } from '@/common/pagination'
import { CONFIG_NAMESPACES } from '@/config'
import { OBJECT_STORAGE } from '@/infra/storage'

import { toFileAssetDto } from './storage.mapper'
import { sniffMime, stripJpegExif } from './storage.mime'
import { getStoragePolicy, isMimeAllowed, STORAGE_POLICIES } from './storage.policy'
import { StorageRepository } from './storage.repository'
import { buildStorageKey } from './storage-key'

import type {
  AuthContext,
  CreateUploadIntent,
  FileAccessUrl,
  FileAsset,
  FileDisposition,
  FileListQuery,
  FilePurpose,
  UploadIntent
} from '@zen/shared'
import type { StorageConfig } from '@/config'
import type { ObjectStoragePort } from '@/infra/storage'

const JPEG_TRANSFORM_MAX_BYTES = 8 * 1024 * 1024

@Injectable()
export class StorageService {
  constructor(
    @Inject(StorageRepository) private readonly repo: StorageRepository,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStoragePort,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(CONFIG_NAMESPACES.STORAGE) private readonly storageConfig: StorageConfig
  ) {}

  async createIntent(
    input: CreateUploadIntent,
    auth: AuthContext,
    options: { forcePurpose?: FilePurpose } = {}
  ): Promise<UploadIntent> {
    const purpose = options.forcePurpose ?? input.purpose
    this.assertCanCreate(purpose, auth)
    this.assertOrganization(input.organizationId, auth)

    const policy = getStoragePolicy(purpose)
    if (input.size > policy.maxSize) {
      throw new BadRequestException(`文件超过大小限制（${policy.maxSize} 字节）`)
    }
    if (!isMimeAllowed(policy, input.mimeType)) {
      throw new BadRequestException('不允许的文件类型')
    }

    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    if (input.idempotencyKey) {
      const existing = await this.repo.findSessionByIdempotency(tenantId, input.idempotencyKey)
      if (existing?.file) {
        return this.toIntent(existing.file, existing)
      }
    }

    const fileId = randomUUID().replaceAll('-', '').slice(0, 24)
    const storageKey = buildStorageKey({
      tenantId,
      purpose,
      fileId,
      originalName: input.originalName
    })
    const expiresAt = new Date(Date.now() + this.storageConfig.uploadUrlTtlSeconds * 1000)
    const fileExpiresAt =
      policy.retentionDays != null
        ? new Date(Date.now() + policy.retentionDays * 24 * 60 * 60 * 1000)
        : null

    const created = await this.repo.createIntent({
      file: {
        id: fileId,
        tenantId,
        ownerId: auth.userId,
        organizationId: input.organizationId ?? null,
        purpose,
        status: 'pending',
        originalName: input.originalName,
        declaredMime: input.mimeType,
        category: resolveFileCategory({
          mimeType: input.mimeType,
          originalName: input.originalName
        }),
        size: input.size,
        sha256: input.checksum?.toLowerCase() ?? null,
        provider: 's3',
        storageKey,
        expiresAt: fileExpiresAt
      },
      session: {
        tenantId,
        strategy: 'presign_put',
        status: 'pending',
        expiresAt,
        ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {})
      }
    })

    const session = created.sessions[0]
    if (!session) throw new BadRequestException('创建上传会话失败')

    await this.audit.write({
      action: 'storage.upload.intent',
      resource: 'file_asset',
      resourceId: created.id,
      diff: { purpose, size: input.size, originalName: input.originalName }
    })

    return this.toIntent(created, session)
  }

  async complete(fileId: string, auth: AuthContext, checksum?: string): Promise<FileAsset> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const row = await this.repo.findByIdWithSessions(tenantId, fileId)
    if (!row) throw new NotFoundException('文件不存在')
    this.assertOwnerOrAdmin(row.ownerId, auth)

    if (row.status === 'ready') return toFileAssetDto(row)
    if (row.status !== 'pending' && row.status !== 'uploaded') {
      throw new BadRequestException('当前状态不可完成上传')
    }

    const session = row.sessions[0]
    if (!session || session.status === 'aborted') {
      throw new BadRequestException('上传会话无效')
    }
    if (session.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('上传会话已过期')
    }

    const head = await this.objectStorage.head(row.storageKey)
    if (!head) throw new BadRequestException('对象尚未上传')
    if (head.size !== row.size) {
      throw new BadRequestException('对象大小与申报不一致')
    }

    const prefix = await this.objectStorage.get(row.storageKey, {
      start: 0,
      end: Math.min(head.size, 64 * 1024) - 1
    })
    const detectedMime = prefix ? sniffMime(prefix.body, row.originalName) : null
    if (detectedMime && detectedMime !== row.declaredMime) {
      const policy = getStoragePolicy(row.purpose as FilePurpose)
      if (!isMimeAllowed(policy, detectedMime)) {
        throw new BadRequestException('检测到的文件类型不被允许')
      }
    }

    let sha256 = row.sha256
    let size = head.size
    const expectedChecksum = (checksum ?? row.sha256)?.toLowerCase()
    if (head.size <= JPEG_TRANSFORM_MAX_BYTES) {
      const full = await this.objectStorage.get(row.storageKey)
      if (full) {
        let body = full.body
        const mime = detectedMime ?? row.declaredMime
        if (mime === 'image/jpeg') {
          body = stripJpegExif(body)
          if (body.length !== full.body.length) {
            await this.objectStorage.put(row.storageKey, body, mime)
            size = body.length
          }
        }
        sha256 = createHash('sha256').update(body).digest('hex')
        if (expectedChecksum && sha256 !== expectedChecksum && mime !== 'image/jpeg') {
          throw new BadRequestException('校验和不匹配')
        }
      }
    } else if (expectedChecksum && prefix) {
      // 大文件仅在客户端提供 checksum 时于 complete 入参校验；此处无法廉价全量哈希
    }

    const mime = detectedMime ?? row.declaredMime
    const updated = await this.repo.update(row.id, {
      status: 'ready',
      detectedMime,
      category: resolveFileCategory({ mimeType: mime, originalName: row.originalName }),
      sha256,
      size
    })
    if (session) {
      await this.repo.updateSession(session.id, { status: 'completed' })
    }

    await this.audit.write({
      action: 'storage.upload.complete',
      resource: 'file_asset',
      resourceId: row.id,
      diff: { size: head.size, detectedMime }
    })

    return toFileAssetDto(updated)
  }

  async abort(fileId: string, auth: AuthContext): Promise<void> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const row = await this.repo.findByIdWithSessions(tenantId, fileId)
    if (!row) throw new NotFoundException('文件不存在')
    this.assertOwnerOrAdmin(row.ownerId, auth)
    if (row.status !== 'pending') throw new BadRequestException('仅能取消未完成的上传')

    await this.objectStorage.delete(row.storageKey).catch(() => undefined)
    await this.repo.update(row.id, { status: 'purged', deletedAt: new Date() })
    const session = row.sessions[0]
    if (session) await this.repo.updateSession(session.id, { status: 'aborted' })
  }

  async list(query: FileListQuery, auth: AuthContext) {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const page = query.page ?? DEFAULT_PAGE
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE
    const where = {
      tenantId,
      ...applyFileDataScope(auth),
      ...(query.purpose ? { purpose: query.purpose } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.keyword
        ? { originalName: { contains: query.keyword, mode: 'insensitive' as const } }
        : {}),
      ...(query.includeDeleted
        ? {}
        : { deletedAt: null, status: query.status ?? { not: 'purged' } })
    }

    return paginate({
      page,
      pageSize,
      count: () => this.repo.count(where),
      findMany: ({ skip, take }) =>
        this.repo.list({ where, skip, take }).then((rows) => rows.map(toFileAssetDto))
    })
  }

  async getOne(fileId: string, auth: AuthContext): Promise<FileAsset> {
    return toFileAssetDto(await this.loadScoped(fileId, auth))
  }

  async createDownloadUrl(
    fileId: string,
    auth: AuthContext,
    disposition: FileDisposition = 'inline'
  ): Promise<FileAccessUrl> {
    const row = await this.loadScoped(fileId, auth)
    if (row.status !== 'ready') throw new BadRequestException('文件尚未就绪')
    const expiresAt = new Date(Date.now() + this.storageConfig.downloadUrlTtlSeconds * 1000)
    const url = await this.objectStorage.presignGet({
      key: row.storageKey,
      expiresInSeconds: this.storageConfig.downloadUrlTtlSeconds,
      disposition,
      filename: row.originalName
    })
    await this.audit.write({
      action: 'storage.file.download_url',
      resource: 'file_asset',
      resourceId: row.id
    })
    return { url, expiresAt: expiresAt.toISOString() }
  }

  async softDelete(fileId: string, auth: AuthContext): Promise<FileAsset> {
    const row = await this.loadScoped(fileId, auth)
    if (row.status === 'deleted') return toFileAssetDto(row)
    const updated = await this.repo.update(row.id, {
      status: 'deleted',
      deletedAt: new Date(),
      purgeAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    await this.audit.write({
      action: 'storage.file.delete',
      resource: 'file_asset',
      resourceId: row.id
    })
    return toFileAssetDto(updated)
  }

  async restore(fileId: string, auth: AuthContext): Promise<FileAsset> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const row = await this.repo.findById(tenantId, fileId, {
      ...applyFileDataScope(auth),
      status: 'deleted'
    })
    if (!row) throw new NotFoundException('文件不存在')
    const updated = await this.repo.update(row.id, {
      status: 'ready',
      deletedAt: null,
      purgeAfter: null
    })
    await this.audit.write({
      action: 'storage.file.restore',
      resource: 'file_asset',
      resourceId: row.id
    })
    return toFileAssetDto(updated)
  }

  async purge(fileId: string, auth: AuthContext): Promise<void> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const row = await this.repo.findById(tenantId, fileId, applyFileDataScope(auth))
    if (!row) throw new NotFoundException('文件不存在')
    await this.objectStorage.delete(row.storageKey).catch(() => undefined)
    await this.repo.update(row.id, {
      status: 'purged',
      deletedAt: row.deletedAt ?? new Date(),
      purgeAfter: null
    })
    await this.audit.write({
      action: 'storage.file.purge',
      resource: 'file_asset',
      resourceId: row.id
    })
  }

  async completeAvatar(fileId: string, auth: AuthContext): Promise<FileAsset> {
    const file = await this.complete(fileId, auth)
    if (file.purpose !== 'avatar') {
      throw new BadRequestException('不是头像文件')
    }
    await this.repo.updateUserAvatar(auth.userId, toFileRef(file.id))
    return file
  }

  listPolicies() {
    return Object.values(STORAGE_POLICIES)
  }

  async resolveAvatarUrl(value: string | null | undefined): Promise<string | null> {
    if (!value) return null
    const fileId = parseFileRef(value)
    if (!fileId) return value
    const row = await this.repo.findById(DEFAULT_TENANT_ID, fileId)
    if (row?.status !== 'ready' || row?.purpose !== 'avatar') return null
    return this.objectStorage.presignGet({
      key: row.storageKey,
      expiresInSeconds: this.storageConfig.downloadUrlTtlSeconds,
      disposition: 'inline',
      filename: row.originalName
    })
  }

  async sweepExpired() {
    const now = new Date()
    const sessions = await this.repo.findExpiredSessions(now)
    for (const session of sessions) {
      await this.objectStorage.delete(session.file.storageKey).catch(() => undefined)
      await this.repo.update(session.fileId, { status: 'purged', deletedAt: now })
      await this.repo.updateSession(session.id, { status: 'aborted' })
    }

    const due = [...(await this.repo.findPurgeDue(now)), ...(await this.repo.findReadyExpired(now))]
    const seen = new Set<string>()
    for (const file of due) {
      if (seen.has(file.id)) continue
      seen.add(file.id)
      await this.objectStorage.delete(file.storageKey).catch(() => undefined)
      await this.repo.update(file.id, { status: 'purged', deletedAt: file.deletedAt ?? now })
    }
  }

  private async loadScoped(fileId: string, auth: AuthContext) {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const row = await this.repo.findById(tenantId, fileId, applyFileDataScope(auth))
    if (!row) throw new NotFoundException('文件不存在')
    return row
  }

  private async toIntent(
    file: { id: string; declaredMime: string; storageKey: string },
    session: { id: string; expiresAt: Date }
  ): Promise<UploadIntent> {
    const signed = await this.objectStorage.presignPut({
      key: file.storageKey,
      mimeType: file.declaredMime,
      expiresInSeconds: this.storageConfig.uploadUrlTtlSeconds
    })
    return {
      fileId: file.id,
      sessionId: session.id,
      method: 'PUT',
      uploadUrl: signed.url,
      headers: signed.headers,
      expiresAt: session.expiresAt.toISOString()
    }
  }

  private assertCanCreate(purpose: FilePurpose, auth: AuthContext) {
    if (purpose === 'avatar') return
    if (auth.isAdmin) return
    if (hasAllPermissions(auth.permissions, [PermissionCode.FILE_UPLOAD])) return
    throw new ForbiddenException(`缺少权限: ${PermissionCode.FILE_UPLOAD}`)
  }

  private assertOwnerOrAdmin(ownerId: string, auth: AuthContext) {
    if (auth.isAdmin || ownerId === auth.userId) return
    throw new ForbiddenException('无权操作该文件')
  }

  private assertOrganization(organizationId: string | undefined, auth: AuthContext) {
    if (!organizationId) return
    if (auth.isAdmin || auth.dataScope === 'all') return
    if (auth.orgIds.includes(organizationId)) return
    if (auth.customOrgIds?.includes(organizationId)) return
    throw new ForbiddenException('无权使用该组织')
  }
}

export { toFileRef }
