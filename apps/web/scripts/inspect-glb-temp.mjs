import fs from 'node:fs'

const file = process.argv[2]
const buf = fs.readFileSync(file)
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
let offset = 12
let json
let bin
while (offset + 8 <= view.byteLength) {
  const len = view.getUint32(offset, true)
  const type = view.getUint32(offset + 4, true)
  const start = offset + 8
  if (type === 0x4e4f534a) {
    json = JSON.parse(new TextDecoder().decode(buf.subarray(start, start + len)))
  } else if (type === 0x004e4942) {
    bin = buf.subarray(start, start + len)
  }
  offset = start + len
}

const doc = json
console.log('file', file)
console.log('asset', JSON.stringify(doc.asset))
console.log('extensionsUsed', doc.extensionsUsed)
console.log('extensionsRequired', doc.extensionsRequired)
console.log('scene', doc.scene, 'scenes', JSON.stringify(doc.scenes))
console.log('skins', doc.skins?.length ?? 0, 'anims', doc.animations?.length ?? 0)
console.log(
  'nodes',
  doc.nodes?.length ?? 0,
  'meshes',
  doc.meshes?.length ?? 0,
  'accessors',
  doc.accessors?.length ?? 0
)

for (const [index, node] of (doc.nodes ?? []).entries()) {
  console.log(
    'NODE',
    index,
    JSON.stringify({
      name: node.name,
      mesh: node.mesh,
      children: node.children,
      translation: node.translation,
      rotation: node.rotation,
      scale: node.scale,
      matrix: node.matrix,
      skin: node.skin
    })
  )
}

const positionIds = new Set()
for (const [index, mesh] of (doc.meshes ?? []).entries()) {
  console.log('MESH', index, mesh.name, 'prims', mesh.primitives.length)
  for (const primitive of mesh.primitives) {
    console.log(
      '  attrs',
      JSON.stringify(primitive.attributes),
      'mode',
      primitive.mode,
      'ext',
      primitive.extensions && Object.keys(primitive.extensions),
      'material',
      primitive.material
    )
    if (primitive.attributes.POSITION !== undefined) positionIds.add(primitive.attributes.POSITION)
  }
}

for (const id of positionIds) {
  const accessor = doc.accessors[id]
  const bufferView = doc.bufferViews[accessor.bufferView]
  const componentBytes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[
    accessor.componentType
  ]
  const stride = bufferView.byteStride ?? componentBytes * 3
  const start = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const data = new DataView(bin.buffer, bin.byteOffset, bin.byteLength)
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  let nonFinite = 0
  for (let vertex = 0; vertex < accessor.count; vertex += 1) {
    const vertexOffset = start + vertex * stride
    for (let axis = 0; axis < 3; axis += 1) {
      const value = readComponent(data, vertexOffset + axis * componentBytes, accessor)
      if (!Number.isFinite(value)) {
        nonFinite += 1
        continue
      }
      min[axis] = Math.min(min[axis], value)
      max[axis] = Math.max(max[axis], value)
    }
  }
  console.log(
    'POS',
    id,
    'count',
    accessor.count,
    'comp',
    accessor.componentType,
    'norm',
    !!accessor.normalized
  )
  console.log('  declared', accessor.min, accessor.max)
  console.log(
    '  scanned',
    min,
    max,
    'size',
    min.map((value, axis) => max[axis] - value),
    'bad',
    nonFinite
  )
}

const drawn = cesiumDrawnSize(doc, bin)
if (drawn) console.log('CESIUM_DRAWN', JSON.stringify(drawn))

function cesiumDrawnSize(document, binary) {
  const skins = document.skins ?? []
  if (skins.length === 0) return null
  const nodes = document.nodes ?? []
  const parents = new Map()
  nodes.forEach((node, index) => {
    for (const child of node.children ?? []) parents.set(child, index)
  })
  const worlds = new Map()
  const scene = document.scenes?.[document.scene ?? 0]
  const roots = scene?.nodes?.length
    ? scene.nodes
    : nodes.flatMap((_, index) => (parents.has(index) ? [] : [index]))
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  let count = 0
  for (const root of roots) visit(root)
  if (count === 0) return null
  return {
    count,
    size: min.map((value, axis) => max[axis] - value),
    min,
    max
  }

  function visit(index) {
    const node = nodes[index]
    if (!node) return
    const world = worldOf(index)
    if (node.mesh !== undefined && node.skin !== undefined) {
      accumulateSkinned(node, world)
    }
    for (const child of node.children ?? []) visit(child)
  }

  function accumulateSkinned(node, meshWorld) {
    const skin = skins[node.skin]
    const inverseMesh = inverseRigid(meshWorld)
    const ibms = readMatrices(document, binary, skin.inverseBindMatrices, skin.joints.length)
    const jointMatrices = skin.joints.map((joint, index) =>
      multiply(multiply(inverseMesh, worldOf(joint)), ibms[index])
    )
    const mesh = document.meshes[node.mesh]
    for (const primitive of mesh.primitives) {
      const positions = readVec(document, binary, primitive.attributes.POSITION, 3)
      const joints = readVec(document, binary, primitive.attributes.JOINTS_0, 4)
      const weights = readVec(document, binary, primitive.attributes.WEIGHTS_0, 4)
      for (let vertex = 0; vertex < positions.length; vertex += 1) {
        const position = positions[vertex]
        const skinned = [0, 0, 0]
        for (let influence = 0; influence < 4; influence += 1) {
          const weight = weights[vertex][influence]
          if (weight === 0) continue
          const transformed = transformPoint(
            jointMatrices[joints[vertex][influence]],
            position[0],
            position[1],
            position[2]
          )
          skinned[0] += weight * transformed[0]
          skinned[1] += weight * transformed[1]
          skinned[2] += weight * transformed[2]
        }
        const worldPoint = transformPoint(meshWorld, skinned[0], skinned[1], skinned[2])
        for (let axis = 0; axis < 3; axis += 1) {
          min[axis] = Math.min(min[axis], worldPoint[axis])
          max[axis] = Math.max(max[axis], worldPoint[axis])
        }
        count += 1
      }
    }
  }

  function worldOf(index) {
    const cached = worlds.get(index)
    if (cached) return cached
    const node = nodes[index]
    const local = localMatrix(node)
    const parent = parents.get(index)
    const world = parent === undefined ? local : multiply(worldOf(parent), local)
    worlds.set(index, world)
    return world
  }
}

function localMatrix(node) {
  if (node.matrix) return node.matrix
  const t = node.translation ?? [0, 0, 0]
  const r = node.rotation ?? [0, 0, 0, 1]
  const s = node.scale ?? [1, 1, 1]
  const scale = [s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, 0, 0, 0, 1]
  const translation = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1]
  return multiply(translation, multiply(quat(r), scale))
}

function quat(rotation) {
  const [x, y, z, w] = rotation
  const x2 = x + x,
    y2 = y + y,
    z2 = z + z
  const xx = x * x2,
    xy = x * y2,
    xz = x * z2,
    yy = y * y2,
    yz = y * z2,
    zz = z * z2
  const wx = w * x2,
    wy = w * y2,
    wz = w * z2
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

function multiply(left, right) {
  const out = new Array(16).fill(0)
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

function transformPoint(matrix, x, y, z) {
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]
  ]
}

function inverseRigid(matrix) {
  const m0 = matrix[0],
    m1 = matrix[1],
    m2 = matrix[2]
  const m4 = matrix[4],
    m5 = matrix[5],
    m6 = matrix[6]
  const m8 = matrix[8],
    m9 = matrix[9],
    m10 = matrix[10]
  const vX = matrix[12],
    vY = matrix[13],
    vZ = matrix[14]
  return [
    m0,
    m4,
    m8,
    0,
    m1,
    m5,
    m9,
    0,
    m2,
    m6,
    m10,
    0,
    -m0 * vX - m1 * vY - m2 * vZ,
    -m4 * vX - m5 * vY - m6 * vZ,
    -m8 * vX - m9 * vY - m10 * vZ,
    1
  ]
}

function readMatrices(document, binary, accessorIndex, count) {
  if (accessorIndex === undefined)
    return Array.from({ length: count }, () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
  const accessor = document.accessors[accessorIndex]
  const bufferView = document.bufferViews[accessor.bufferView]
  const start = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const data = new DataView(binary.buffer, binary.byteOffset, binary.byteLength)
  return Array.from({ length: accessor.count }, (_, index) => {
    const matrix = []
    for (let element = 0; element < 16; element += 1)
      matrix.push(data.getFloat32(start + (index * 16 + element) * 4, true))
    return matrix
  })
}

function readVec(document, binary, accessorIndex, width) {
  const accessor = document.accessors[accessorIndex]
  const bufferView = document.bufferViews[accessor.bufferView]
  const componentBytes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[
    accessor.componentType
  ]
  const stride = bufferView.byteStride ?? componentBytes * width
  const start = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const data = new DataView(binary.buffer, binary.byteOffset, binary.byteLength)
  const values = []
  for (let index = 0; index < accessor.count; index += 1) {
    const item = []
    for (let axis = 0; axis < width; axis += 1) {
      item.push(readComponent(data, start + index * stride + axis * componentBytes, accessor))
    }
    values.push(item)
  }
  return values
}

const skin = doc.skins?.[0]
if (skin) {
  console.log(
    'SKIN joints',
    skin.joints,
    'ibm',
    skin.inverseBindMatrices,
    'skeleton',
    skin.skeleton
  )
  const accessor = doc.accessors[skin.inverseBindMatrices]
  const bufferView = doc.bufferViews[accessor.bufferView]
  const start = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const data = new DataView(bin.buffer, bin.byteOffset, bin.byteLength)
  for (let joint = 0; joint < accessor.count; joint += 1) {
    const matrix = []
    for (let element = 0; element < 16; element += 1) {
      matrix.push(data.getFloat32(start + (joint * 16 + element) * 4, true))
    }
    const scale = [
      Math.hypot(matrix[0], matrix[1], matrix[2]),
      Math.hypot(matrix[4], matrix[5], matrix[6]),
      Math.hypot(matrix[8], matrix[9], matrix[10])
    ]
    console.log('IBM', joint, 'node', skin.joints[joint], 'scale', scale, 'trans', [
      matrix[12],
      matrix[13],
      matrix[14]
    ])
  }
}

for (const [index, animation] of (doc.animations ?? []).entries()) {
  console.log(
    'ANIM',
    index,
    animation.name,
    'channels',
    animation.channels.map((channel) => ({
      node: channel.target.node,
      path: channel.target.path,
      sampler: channel.sampler
    }))
  )
  for (const [samplerIndex, sampler] of animation.samplers.entries()) {
    const input = doc.accessors[sampler.input]
    const output = doc.accessors[sampler.output]
    console.log(
      '  sampler',
      samplerIndex,
      sampler.interpolation,
      'input',
      input.min,
      input.max,
      input.count,
      'output',
      output.type,
      output.count
    )
  }
}

function readComponent(data, componentOffset, accessor) {
  switch (accessor.componentType) {
    case 5126:
      return data.getFloat32(componentOffset, true)
    case 5125:
      return data.getUint32(componentOffset, true)
    case 5123:
      return accessor.normalized
        ? data.getUint16(componentOffset, true) / 65535
        : data.getUint16(componentOffset, true)
    case 5121:
      return accessor.normalized
        ? data.getUint8(componentOffset) / 255
        : data.getUint8(componentOffset)
    case 5122:
      return accessor.normalized
        ? Math.max(data.getInt16(componentOffset, true) / 32767, -1)
        : data.getInt16(componentOffset, true)
    case 5120:
      return accessor.normalized
        ? Math.max(data.getInt8(componentOffset) / 127, -1)
        : data.getInt8(componentOffset)
    default:
      return Number.NaN
  }
}
