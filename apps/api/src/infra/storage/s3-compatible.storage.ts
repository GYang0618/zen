import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Inject, Injectable } from '@nestjs/common'

import { CONFIG_NAMESPACES } from '@/config'

import type { Readable } from 'node:stream'
import type { StorageConfig } from '@/config'
import type {
  ObjectGetResult,
  ObjectHeadResult,
  ObjectStoragePort,
  PresignGetInput,
  PresignPutInput,
  PresignPutResult
} from './object-storage.port'

@Injectable()
export class S3CompatibleStorage implements ObjectStoragePort {
  private readonly client: S3Client

  constructor(@Inject(CONFIG_NAMESPACES.STORAGE) private readonly config: StorageConfig) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey
      }
    })
  }

  async presignPut(input: PresignPutInput): Promise<PresignPutResult> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: input.key,
      ContentType: input.mimeType
    })
    const internalUrl = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds
    })
    return {
      url: rewriteEndpoint(internalUrl, this.config.endpoint, this.config.publicEndpoint),
      headers: { 'Content-Type': input.mimeType },
      method: 'PUT'
    }
  }

  async presignGet(input: PresignGetInput): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: input.key,
      ResponseContentDisposition: contentDisposition(input.disposition ?? 'inline', input.filename)
    })
    const internalUrl = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds
    })
    return rewriteEndpoint(internalUrl, this.config.endpoint, this.config.publicEndpoint)
  }

  async head(key: string): Promise<ObjectHeadResult | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.config.bucket, Key: key })
      )
      return {
        size: result.ContentLength ?? 0,
        contentType: result.ContentType ?? null,
        etag: result.ETag ?? null
      }
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  }

  async get(key: string, range?: { start: number; end: number }): Promise<ObjectGetResult | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Range: range ? `bytes=${range.start}-${range.end}` : undefined
        })
      )
      const body = await streamToBuffer(result.Body as Readable | undefined)
      return { body, contentType: result.ContentType ?? null }
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  }

  async put(key: string, body: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: mimeType
      })
    )
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      })
    )
  }
}

function contentDisposition(type: 'inline' | 'attachment', filename?: string) {
  if (!filename) return type
  const ascii = filename.replace(/[^\u0020-\u007E]/g, '_').replace(/["\\]/g, '_')
  const encoded = encodeURIComponent(filename)
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encoded}`
}

function rewriteEndpoint(signedUrl: string, internalEndpoint: string, publicEndpoint: string) {
  const signed = new URL(signedUrl)
  const internal = new URL(internalEndpoint)
  const pub = new URL(publicEndpoint)
  if (signed.host === internal.host) {
    signed.protocol = pub.protocol
    signed.host = pub.host
  }
  return signed.toString()
}

function isNotFound(error: unknown) {
  const name = (error as { name?: string; $metadata?: { httpStatusCode?: number } }).name
  const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
  return name === 'NotFound' || name === 'NoSuchKey' || status === 404
}

async function streamToBuffer(stream: Readable | undefined): Promise<Buffer> {
  if (!stream) return Buffer.alloc(0)
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
