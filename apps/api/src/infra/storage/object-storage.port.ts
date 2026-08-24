export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE')

export type PresignPutInput = {
  key: string
  mimeType: string
  expiresInSeconds: number
}

export type PresignPutResult = {
  url: string
  headers: Record<string, string>
  method: 'PUT'
}

export type ObjectHeadResult = {
  size: number
  contentType: string | null
  etag: string | null
}

export type ObjectGetResult = {
  body: Buffer
  contentType: string | null
}

export type PresignGetInput = {
  key: string
  expiresInSeconds: number
  disposition?: 'inline' | 'attachment'
  filename?: string
}

export interface ObjectStoragePort {
  presignPut(input: PresignPutInput): Promise<PresignPutResult>
  presignGet(input: PresignGetInput): Promise<string>
  head(key: string): Promise<ObjectHeadResult | null>
  get(key: string, range?: { start: number; end: number }): Promise<ObjectGetResult | null>
  put(key: string, body: Buffer, mimeType: string): Promise<void>
  delete(key: string): Promise<void>
}
