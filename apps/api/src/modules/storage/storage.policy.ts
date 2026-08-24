import type { FilePurpose } from '@zen/shared'

export type StoragePolicy = {
  purpose: FilePurpose
  maxSize: number
  mimeTypes: readonly string[]
  retentionDays: number | null
  visibility: 'private'
  requiredPermission: 'authenticated' | 'file:upload'
}

const MB = 1024 * 1024

export const STORAGE_POLICIES: Record<Exclude<FilePurpose, 'legacy'>, StoragePolicy> = {
  avatar: {
    purpose: 'avatar',
    maxSize: 2 * MB,
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    retentionDays: null,
    visibility: 'private',
    requiredPermission: 'authenticated'
  },
  attachment: {
    purpose: 'attachment',
    maxSize: 512 * MB,
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-7z-compressed',
      'application/x-rar-compressed',
      'application/vnd.rar',
      'application/gzip',
      'application/x-tar'
    ],
    retentionDays: null,
    visibility: 'private',
    requiredPermission: 'file:upload'
  },
  export: {
    purpose: 'export',
    maxSize: 100 * MB,
    mimeTypes: [
      'application/pdf',
      'text/csv',
      'application/zip',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    retentionDays: 30,
    visibility: 'private',
    requiredPermission: 'file:upload'
  },
  temp: {
    purpose: 'temp',
    maxSize: 20 * MB,
    mimeTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'application/zip'],
    retentionDays: 1,
    visibility: 'private',
    requiredPermission: 'file:upload'
  }
}

export function getStoragePolicy(purpose: FilePurpose): StoragePolicy {
  if (purpose === 'legacy') {
    return {
      purpose: 'legacy',
      maxSize: 50 * MB,
      mimeTypes: ['*/*'],
      retentionDays: null,
      visibility: 'private',
      requiredPermission: 'file:upload'
    }
  }
  return STORAGE_POLICIES[purpose]
}

export function isMimeAllowed(policy: StoragePolicy, mimeType: string) {
  if (policy.mimeTypes.includes('*/*')) return true
  const normalized = mimeType.toLowerCase().split(';')[0]?.trim() ?? ''
  return policy.mimeTypes.includes(normalized)
}
