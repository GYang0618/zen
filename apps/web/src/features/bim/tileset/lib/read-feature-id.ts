import { InterleavedBufferAttribute } from 'three'

import type { BufferAttribute, BufferGeometry, Mesh, Vector3 } from 'three'

function getMaxBarycoordIndex(barycoord: Vector3): number {
  if (barycoord.x > barycoord.y && barycoord.x > barycoord.z) return 0
  if (barycoord.y > barycoord.z) return 1
  return 2
}

function getTriangleVertexIndices(
  geometry: BufferGeometry,
  triangle: number
): [number, number, number] {
  const index = geometry.index
  if (index) {
    const i = triangle * 3
    return [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
  }
  const base = triangle * 3
  return [base, base + 1, base + 2]
}

function getFeatureIdAttribute(
  geometry: BufferGeometry,
  attributeIndex: number
): BufferAttribute | undefined {
  const exact = [`_feature_id_${attributeIndex}`, `_FEATURE_ID_${attributeIndex}`]
  for (const name of exact) {
    const attr = geometry.getAttribute(name)
    if (attr) return attr as BufferAttribute
  }

  for (const name of Object.keys(geometry.attributes)) {
    if (name.toLowerCase() === `_feature_id_${attributeIndex}`) {
      return geometry.getAttribute(name) as BufferAttribute
    }
  }

  return undefined
}

/** BIM 瓦片常把整型 feature id 错标为 FLOAT，需按 uint32 重解释 */
function readScalarAt(array: ArrayLike<number>, index: number): number {
  if (array instanceof Float32Array) {
    const byteOffset = array.byteOffset + index * 4
    const asUint = new Uint32Array(array.buffer, byteOffset, 1)[0]
    const asFloat = array[index]
    if (!Number.isFinite(asFloat) || (Math.abs(asFloat) < 1e-6 && asUint > 0)) return asUint
    return Math.trunc(asFloat)
  }

  if (array instanceof Uint32Array) return array[index]
  if (array instanceof Uint16Array) return array[index]
  if (array instanceof Int32Array) return array[index]

  return Math.trunc(array[index] ?? Number.NaN)
}

function readFeatureIdScalar(attr: BufferAttribute, vertexIndex: number): number {
  if (attr instanceof InterleavedBufferAttribute) {
    const stride = attr.data.stride
    const index = vertexIndex * stride + attr.offset
    return readScalarAt(attr.data.array, index)
  }

  if (attr.itemSize !== 1) return Math.trunc(attr.getX(vertexIndex))
  return readScalarAt(attr.array, vertexIndex)
}

/** 从 mesh 几何读取点击处的 feature id（与 property table 行号对应） */
export function readFeatureIdAt(
  mesh: Mesh,
  attributeIndex: number,
  faceIndex: number,
  barycoord: Vector3
): number | null {
  const attr = getFeatureIdAttribute(mesh.geometry, attributeIndex)
  if (!attr) return null

  const [a, b, c] = getTriangleVertexIndices(mesh.geometry, faceIndex)
  const vertexIndex = [a, b, c][getMaxBarycoordIndex(barycoord)]
  const value = readFeatureIdScalar(attr, vertexIndex)

  return Number.isFinite(value) ? value : null
}
