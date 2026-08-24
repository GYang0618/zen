import { resolveOfficeZipMime } from '@zen/shared'

export function sniffMime(buffer: Buffer, originalName?: string): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png'
  }
  if (buffer.length >= 6) {
    const header = buffer.subarray(0, 6).toString('ascii')
    if (header === 'GIF87a' || header === 'GIF89a') return 'image/gif'
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return 'video/mp4'
  }
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf) {
    return 'video/webm'
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF') {
    return 'application/pdf'
  }
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return resolveOfficeZipMime(originalName) ?? 'application/zip'
  }
  return null
}

/** 去掉 JPEG APP1/EXIF 段，其它格式原样返回 */
export function stripJpegExif(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return buffer

  const parts: Buffer[] = [buffer.subarray(0, 2)]
  let offset = 2
  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) {
      parts.push(buffer.subarray(offset))
      break
    }
    const marker = buffer[offset + 1]
    if (marker === 0xda) {
      parts.push(buffer.subarray(offset))
      break
    }
    if (offset + 3 >= buffer.length) {
      parts.push(buffer.subarray(offset))
      break
    }
    const size = (buffer[offset + 2] << 8) | buffer[offset + 3]
    const next = offset + 2 + size
    if (marker === 0xe1) {
      offset = next
      continue
    }
    parts.push(buffer.subarray(offset, next))
    offset = next
  }
  return Buffer.concat(parts)
}
