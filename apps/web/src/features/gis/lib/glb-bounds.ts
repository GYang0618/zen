import { z } from 'zod'

const vec3Schema = z.tuple([z.number(), z.number(), z.number()])

const gltfSchema = z.object({
  accessors: z
    .array(
      z.object({
        bufferView: z.number().optional(),
        byteOffset: z.number().optional(),
        componentType: z.number(),
        count: z.number(),
        type: z.string(),
        min: z.array(z.number()).optional(),
        max: z.array(z.number()).optional(),
        normalized: z.boolean().optional()
      })
    )
    .optional(),
  bufferViews: z
    .array(
      z.object({
        buffer: z.number(),
        byteOffset: z.number().optional(),
        byteLength: z.number(),
        byteStride: z.number().optional()
      })
    )
    .optional(),
  meshes: z
    .array(
      z.object({
        primitives: z.array(
          z.object({
            attributes: z.record(z.string(), z.number())
          })
        )
      })
    )
    .optional(),
  nodes: z
    .array(
      z.object({
        mesh: z.number().optional(),
        children: z.array(z.number()).optional(),
        matrix: z.array(z.number()).length(16).optional(),
        translation: vec3Schema.optional(),
        rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
        scale: vec3Schema.optional()
      })
    )
    .optional(),
  scenes: z
    .array(
      z.object({
        nodes: z.array(z.number()).optional()
      })
    )
    .optional(),
  scene: z.number().optional()
})

type GltfDocument = z.infer<typeof gltfSchema>
type GltfNode = NonNullable<GltfDocument['nodes']>[number]

export type GlbBounds = {
  min: [number, number, number]
  max: [number, number, number]
  center: [number, number, number]
  size: [number, number, number]
  radius: number
}

const GLB_MAGIC = 0x46546c67
const JSON_CHUNK = 0x4e4f534a
const BIN_CHUNK = 0x004e4942
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
const COMPONENT_BYTES: Record<number, number> = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4
}

const boundsCache = new Map<string, Promise<GlbBounds>>()

/** 读取 GLB 并返回场景空间包围盒。同一地址只解析一次。 */
export function measureGlb(uri: string): Promise<GlbBounds> {
  const cached = boundsCache.get(uri)
  if (cached) return cached

  const pending = fetch(uri)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`无法读取模型 ${uri}：${response.status}`)
      }
      return response.arrayBuffer()
    })
    .then((buffer) => parseGlbBounds(buffer))

  boundsCache.set(uri, pending)
  pending.catch(() => {
    boundsCache.delete(uri)
  })
  return pending
}

/** 从 GLB 二进制解析网格包围盒。单位按 glTF 约定为米。 */
export function parseGlbBounds(data: ArrayBuffer): GlbBounds {
  const { document, bin } = readGlb(data)
  const corners = collectWorldCorners(document, bin)
  if (corners.length === 0) {
    throw new Error('模型中没有可测量的网格')
  }
  return boundsFromCorners(corners)
}

function readGlb(data: ArrayBuffer): { document: GltfDocument; bin: Uint8Array } {
  const view = new DataView(data)
  if (view.byteLength < 20 || view.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error('不是有效的 GLB 文件')
  }

  let offset = 12
  let json: unknown
  let bin = new Uint8Array()
  while (offset + 8 <= view.byteLength) {
    const chunkLength = view.getUint32(offset, true)
    const chunkType = view.getUint32(offset + 4, true)
    const chunkStart = offset + 8
    if (chunkType === JSON_CHUNK) {
      const text = new TextDecoder().decode(new Uint8Array(data, chunkStart, chunkLength))
      json = JSON.parse(text) as unknown
    } else if (chunkType === BIN_CHUNK) {
      bin = new Uint8Array(data, chunkStart, chunkLength)
    }
    offset = chunkStart + chunkLength
  }

  return { document: gltfSchema.parse(json), bin }
}

function collectWorldCorners(
  document: GltfDocument,
  bin: Uint8Array
): Array<[number, number, number]> {
  const nodes = document.nodes ?? []
  const parents = parentIndex(nodes)
  const worlds = new Map<number, number[]>()
  const corners: Array<[number, number, number]> = []

  for (const root of sceneRoots(document, parents)) {
    visitNode(root, nodes, document, bin, parents, worlds, corners)
  }
  return corners
}

function visitNode(
  index: number,
  nodes: GltfNode[],
  document: GltfDocument,
  bin: Uint8Array,
  parents: Map<number, number>,
  worlds: Map<number, number[]>,
  corners: Array<[number, number, number]>
): void {
  const node = nodes[index]
  if (!node) return
  const world = worldMatrix(index, nodes, parents, worlds)
  appendMeshCorners(node.mesh, world, document, bin, corners)
  for (const child of node.children ?? []) {
    visitNode(child, nodes, document, bin, parents, worlds, corners)
  }
}

function appendMeshCorners(
  meshIndex: number | undefined,
  world: number[],
  document: GltfDocument,
  bin: Uint8Array,
  corners: Array<[number, number, number]>
): void {
  if (meshIndex === undefined) return
  const mesh = document.meshes?.[meshIndex]
  if (!mesh) return
  for (const primitive of mesh.primitives) {
    const accessorIndex = primitive.attributes.POSITION
    if (accessorIndex === undefined) continue
    const box = accessorBox(document, bin, accessorIndex)
    if (!box) continue
    pushTransformedCorners(world, box.min, box.max, corners)
  }
}

function boundsFromCorners(corners: Array<[number, number, number]>): GlbBounds {
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const corner of corners) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], corner[axis])
      max[axis] = Math.max(max[axis], corner[axis])
    }
  }
  const size: [number, number, number] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2
  ]
  let radius = 0
  for (const corner of corners) {
    const dx = corner[0] - center[0]
    const dy = corner[1] - center[1]
    const dz = corner[2] - center[2]
    radius = Math.max(radius, Math.hypot(dx, dy, dz))
  }
  return { min, max, center, size, radius }
}

function accessorBox(
  document: GltfDocument,
  bin: Uint8Array,
  accessorIndex: number
): { min: [number, number, number]; max: [number, number, number] } | null {
  const accessor = document.accessors?.[accessorIndex]
  if (accessor?.type !== 'VEC3') return null
  if (isVec3(accessor.min) && isVec3(accessor.max)) {
    return { min: accessor.min, max: accessor.max }
  }
  return scanAccessorBox(document, bin, accessor)
}

function scanAccessorBox(
  document: GltfDocument,
  bin: Uint8Array,
  accessor: NonNullable<GltfDocument['accessors']>[number]
): { min: [number, number, number]; max: [number, number, number] } | null {
  const view = document.bufferViews?.[accessor.bufferView ?? -1]
  if (view?.buffer !== 0) return null
  const componentBytes = COMPONENT_BYTES[accessor.componentType]
  if (!componentBytes) return null

  const stride = view.byteStride ?? componentBytes * 3
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  const data = new DataView(bin.buffer, bin.byteOffset, bin.byteLength)

  for (let index = 0; index < accessor.count; index += 1) {
    const vertex = start + index * stride
    for (let axis = 0; axis < 3; axis += 1) {
      const value = readComponent(data, vertex + axis * componentBytes, accessor)
      min[axis] = Math.min(min[axis], value)
      max[axis] = Math.max(max[axis], value)
    }
  }
  return { min, max }
}

function readComponent(
  data: DataView,
  offset: number,
  accessor: NonNullable<GltfDocument['accessors']>[number]
): number {
  switch (accessor.componentType) {
    case 5126:
      return data.getFloat32(offset, true)
    case 5125:
      return data.getUint32(offset, true)
    case 5123:
      return normalizeInteger(data.getUint16(offset, true), 65535, accessor.normalized)
    case 5121:
      return normalizeInteger(data.getUint8(offset), 255, accessor.normalized)
    case 5122:
      return normalizeInteger(data.getInt16(offset, true), 32767, accessor.normalized)
    case 5120:
      return normalizeInteger(data.getInt8(offset), 127, accessor.normalized)
    default:
      return 0
  }
}

function normalizeInteger(value: number, limit: number, normalized: boolean | undefined): number {
  if (!normalized) return value
  return Math.max(value / limit, -1)
}

function sceneRoots(document: GltfDocument, parents: Map<number, number>): number[] {
  const scene = document.scenes?.[document.scene ?? 0]
  if (scene?.nodes && scene.nodes.length > 0) return scene.nodes
  const nodes = document.nodes ?? []
  return nodes.flatMap((_, index) => (parents.has(index) ? [] : [index]))
}

function parentIndex(nodes: GltfNode[]): Map<number, number> {
  const parents = new Map<number, number>()
  nodes.forEach((node, index) => {
    for (const child of node.children ?? []) {
      parents.set(child, index)
    }
  })
  return parents
}

function worldMatrix(
  index: number,
  nodes: GltfNode[],
  parents: Map<number, number>,
  cache: Map<number, number[]>
): number[] {
  const cached = cache.get(index)
  if (cached) return cached
  const node = nodes[index]
  const local = node ? localMatrix(node) : IDENTITY
  const parent = parents.get(index)
  const world =
    parent === undefined ? local : multiplyMatrix(worldMatrix(parent, nodes, parents, cache), local)
  cache.set(index, world)
  return world
}

function localMatrix(node: GltfNode): number[] {
  if (node.matrix) return [...node.matrix]
  const translation = node.translation ?? [0, 0, 0]
  const rotation = node.rotation ?? [0, 0, 0, 1]
  const scale = node.scale ?? [1, 1, 1]
  const scaleMatrix = [scale[0], 0, 0, 0, 0, scale[1], 0, 0, 0, 0, scale[2], 0, 0, 0, 0, 1]
  const translationMatrix = [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    translation[0],
    translation[1],
    translation[2],
    1
  ]
  return multiplyMatrix(translationMatrix, multiplyMatrix(quaternionMatrix(rotation), scaleMatrix))
}

function quaternionMatrix(rotation: [number, number, number, number]): number[] {
  const [x, y, z, w] = rotation
  const x2 = x + x
  const y2 = y + y
  const z2 = z + z
  const xx = x * x2
  const xy = x * y2
  const xz = x * z2
  const yy = y * y2
  const yz = y * z2
  const zz = z * z2
  const wx = w * x2
  const wy = w * y2
  const wz = w * z2
  return [
    1 - (yy + zz),
    xy + wz,
    xz - wy,
    0,
    xy - wz,
    1 - (xx + zz),
    yz + wx,
    0,
    xz + wy,
    yz - wx,
    1 - (xx + yy),
    0,
    0,
    0,
    0,
    1
  ]
}

function multiplyMatrix(left: number[], right: number[]): number[] {
  const out = new Array<number>(16).fill(0)
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] =
        left[row] * right[column * 4] +
        left[4 + row] * right[column * 4 + 1] +
        left[8 + row] * right[column * 4 + 2] +
        left[12 + row] * right[column * 4 + 3]
    }
  }
  return out
}

function pushTransformedCorners(
  world: number[],
  min: [number, number, number],
  max: [number, number, number],
  corners: Array<[number, number, number]>
): void {
  for (const x of [min[0], max[0]]) {
    for (const y of [min[1], max[1]]) {
      for (const z of [min[2], max[2]]) {
        corners.push(transformPoint(world, x, y, z))
      }
    }
  }
}

function transformPoint(
  matrix: number[],
  x: number,
  y: number,
  z: number
): [number, number, number] {
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]
  ]
}

function isVec3(value: number[] | undefined): value is [number, number, number] {
  return !!value && value.length >= 3 && value.every((item) => Number.isFinite(item))
}
