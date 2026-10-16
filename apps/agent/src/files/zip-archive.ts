import { inflateRawSync } from 'node:zlib'

const LOCAL_HEADER = 0x04034b50
const CENTRAL_HEADER = 0x02014b50
const EOCD_HEADER = 0x06054b50
const ZIP_VERSION = 20

const CRC_TABLE = createCrcTable()

export function unzip(bytes: Uint8Array): Map<string, Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const eocd = findEocd(view)
  const files = new Map<string, Uint8Array>()
  let cursor = eocd.offset
  for (let index = 0; index < eocd.count; index += 1) {
    if (view.getUint32(cursor, true) !== CENTRAL_HEADER) break
    const method = view.getUint16(cursor + 10, true)
    const compressedSize = view.getUint32(cursor + 20, true)
    const nameLength = view.getUint16(cursor + 28, true)
    const extraLength = view.getUint16(cursor + 30, true)
    const commentLength = view.getUint16(cursor + 32, true)
    const localOffset = view.getUint32(cursor + 42, true)
    const name = decodeName(bytes, cursor + 46, nameLength)
    cursor += 46 + nameLength + extraLength + commentLength
    if (!isSafeEntry(name)) continue
    const data = readLocalData(bytes, view, localOffset, method, compressedSize)
    if (data) files.set(name, data)
  }
  return files
}

export function zipStore(entries: ReadonlyMap<string, Uint8Array>): Uint8Array {
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const [name, data] of entries) {
    const nameBytes = new TextEncoder().encode(name)
    const checksum = crc32(data)
    locals.push(localHeader(nameBytes, data, checksum))
    centrals.push(centralHeader(nameBytes, data, checksum, offset))
    offset += locals.at(-1)?.byteLength ?? 0
  }
  const centralOffset = offset
  const centralSize = centrals.reduce((sum, part) => sum + part.byteLength, 0)
  return concat([...locals, ...centrals, eocd(entries.size, centralSize, centralOffset)])
}

function readLocalData(
  bytes: Uint8Array,
  view: DataView,
  offset: number,
  method: number,
  compressedSize: number
) {
  if (view.getUint32(offset, true) !== LOCAL_HEADER) return undefined
  const nameLength = view.getUint16(offset + 26, true)
  const extraLength = view.getUint16(offset + 28, true)
  const start = offset + 30 + nameLength + extraLength
  const compressed = bytes.subarray(start, start + compressedSize)
  if (method === 0) return compressed
  if (method === 8) return new Uint8Array(inflateRawSync(compressed))
  return undefined
}

function localHeader(name: Uint8Array, data: Uint8Array, checksum: number) {
  const header = new Uint8Array(30 + name.byteLength + data.byteLength)
  const view = new DataView(header.buffer)
  view.setUint32(0, LOCAL_HEADER, true)
  view.setUint16(4, ZIP_VERSION, true)
  view.setUint16(8, 0, true)
  view.setUint32(14, checksum, true)
  view.setUint32(18, data.byteLength, true)
  view.setUint32(22, data.byteLength, true)
  view.setUint16(26, name.byteLength, true)
  header.set(name, 30)
  header.set(data, 30 + name.byteLength)
  return header
}

function centralHeader(name: Uint8Array, data: Uint8Array, checksum: number, offset: number) {
  const header = new Uint8Array(46 + name.byteLength)
  const view = new DataView(header.buffer)
  view.setUint32(0, CENTRAL_HEADER, true)
  view.setUint16(4, ZIP_VERSION, true)
  view.setUint16(6, ZIP_VERSION, true)
  view.setUint32(16, checksum, true)
  view.setUint32(20, data.byteLength, true)
  view.setUint32(24, data.byteLength, true)
  view.setUint16(28, name.byteLength, true)
  view.setUint32(42, offset, true)
  header.set(name, 46)
  return header
}

function eocd(count: number, centralSize: number, centralOffset: number) {
  const header = new Uint8Array(22)
  const view = new DataView(header.buffer)
  view.setUint32(0, EOCD_HEADER, true)
  view.setUint16(8, count, true)
  view.setUint16(10, count, true)
  view.setUint32(12, centralSize, true)
  view.setUint32(16, centralOffset, true)
  return header
}

function findEocd(view: DataView) {
  const min = Math.max(0, view.byteLength - 22 - 65535)
  for (let offset = view.byteLength - 22; offset >= min; offset -= 1) {
    if (view.getUint32(offset, true) !== EOCD_HEADER) continue
    return {
      count: view.getUint16(offset + 10, true),
      offset: view.getUint32(offset + 16, true)
    }
  }
  throw new Error('不是有效的 Word 或 Excel 文档')
}

function decodeName(bytes: Uint8Array, offset: number, length: number) {
  return new TextDecoder().decode(bytes.subarray(offset, offset + length))
}

function isSafeEntry(name: string) {
  return name.length > 0 && !name.endsWith('/') && !name.split('/').includes('..')
}

function concat(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.byteLength
  }
  return out
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of data) {
    const next = CRC_TABLE[(crc ^ byte) & 0xff] ?? 0
    crc = (next ^ (crc >>> 8)) >>> 0
  }
  return (crc ^ 0xffffffff) >>> 0
}

function createCrcTable() {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[index] = value >>> 0
  }
  return table
}
