import { BufferGeometry, Mesh } from 'three'
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'

/**
 * 全局接管 three.js 的 raycast：用 three-mesh-bvh 的 BVH 加速结构替换线性三角扫描。
 * 海量构件（10w+）下，点击拾取从“遍历全部三角面”降为对数级，消除点击卡顿。
 * 仅需在应用内执行一次（通过 side-effect import）。
 */
type BufferGeometryBvhPrototype = {
  computeBoundsTree: typeof computeBoundsTree
  disposeBoundsTree: typeof disposeBoundsTree
}

const geometryProto = BufferGeometry.prototype as unknown as BufferGeometryBvhPrototype
geometryProto.computeBoundsTree = computeBoundsTree
geometryProto.disposeBoundsTree = disposeBoundsTree

const meshProto = Mesh.prototype as { raycast: typeof acceleratedRaycast }
meshProto.raycast = acceleratedRaycast
