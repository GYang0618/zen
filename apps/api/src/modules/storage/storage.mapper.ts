import type { FileAsset } from '@prisma/client'
import type { FileAsset as FileAssetDto } from '@zen/shared'

export function toFileAssetDto(row: FileAsset): FileAssetDto {
  return {
    id: row.id,
    tenantId: row.tenantId,
    ownerId: row.ownerId,
    organizationId: row.organizationId,
    purpose: row.purpose as FileAssetDto['purpose'],
    category: row.category as FileAssetDto['category'],
    status: row.status as FileAssetDto['status'],
    originalName: row.originalName,
    mimeType: row.detectedMime ?? row.declaredMime,
    size: row.size,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null
  }
}
