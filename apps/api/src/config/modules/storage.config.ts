import { registerConfig } from '../helper'

/**
 * 对象存储配置（MinIO / S3 兼容）。按租户覆盖预留，当前只读默认租户环境变量。
 */
export const storageConfig = registerConfig('storage', (env) => ({
  driver: env.STORAGE_DRIVER,
  endpoint: env.STORAGE_ENDPOINT,
  publicEndpoint: env.STORAGE_PUBLIC_ENDPOINT,
  region: env.STORAGE_REGION,
  bucket: env.STORAGE_BUCKET,
  accessKey: env.STORAGE_ACCESS_KEY,
  secretKey: env.STORAGE_SECRET_KEY,
  forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
  uploadUrlTtlSeconds: env.STORAGE_UPLOAD_URL_TTL,
  downloadUrlTtlSeconds: env.STORAGE_DOWNLOAD_URL_TTL
}))
