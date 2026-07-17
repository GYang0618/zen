import { Vector3 } from 'three'

import {
  WALKTHROUGH_BODY_PROBE_HEIGHTS,
  WALKTHROUGH_CAMERA_DISTANCE,
  WALKTHROUGH_CAMERA_HEIGHT,
  WALKTHROUGH_CAMERA_LOOK_HEIGHT,
  WALKTHROUGH_CAMERA_MIN_DISTANCE,
  WALKTHROUGH_CAMERA_OCCLUSION_PADDING,
  WALKTHROUGH_COLLISION_PADDING,
  WALKTHROUGH_COLLISION_RADIUS,
  WALKTHROUGH_EYE_HEIGHT,
  WALKTHROUGH_FLOOR_NORMAL_Y
} from '../constants'
import { getObjectKind, getObjectUserData } from './object'

import type { Intersection, Mesh, Object3D, Raycaster } from 'three'

const _moveDir = new Vector3()
const _offset = new Vector3()
const _normal = new Vector3()
const _down = new Vector3(0, -1, 0)
const _probeOrigin = new Vector3()
const _floorOrigin = new Vector3()
const _camDir = new Vector3()
const _camFrom = new Vector3()

export function isWalkthroughHelper(object: Object3D): boolean {
  return object.userData.walkthroughHelper === true
}

export function isSpaceObject(object: Object3D): boolean {
  return getObjectKind(getObjectUserData(object)) === 'space'
}

/** 可作为地面/墙体碰撞或拾取的实体网格（排除空间与辅助物体） */
export function isSolidWalkMesh(object: Object3D): boolean {
  if (!(object as Mesh).isMesh) return false
  if (!object.visible) return false
  if (object.type === 'GridHelper') return false
  if (isWalkthroughHelper(object)) return false
  if (isSpaceObject(object)) return false
  return true
}

export function collectSolidWalkMeshes(root: Object3D): Mesh[] {
  const meshes: Mesh[] = []
  root.traverse((object) => {
    if (isSolidWalkMesh(object)) meshes.push(object as Mesh)
  })
  return meshes
}

/**
 * 拾取期间临时隐藏 IfcSpace，避免射线先打到空间体导致点位悬空。
 * @returns 恢复可见性的 cleanup
 */
export function hideSpaceMeshes(root: Object3D): () => void {
  const hidden: Object3D[] = []
  root.traverse((object) => {
    if (!(object as Mesh).isMesh || !object.visible) return
    if (!isSpaceObject(object)) return
    object.visible = false
    hidden.push(object)
  })
  return () => {
    for (const object of hidden) object.visible = true
  }
}

function worldFaceNormalY(hit: Intersection): number {
  if (!hit.face) return 0
  _normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld)
  return _normal.y
}

/** 从射线命中中选取地面点；优先近水平面，否则取最近实体 */
export function pickWalkthroughFloorHit(hits: Intersection[]): Intersection | undefined {
  const solidHits = hits.filter(({ object }) => isSolidWalkMesh(object))
  if (solidHits.length === 0) return undefined

  const floorHit = solidHits.find((hit) => worldFaceNormalY(hit) >= WALKTHROUGH_FLOOR_NORMAL_Y)
  return floorHit ?? solidHits[0]
}

function castMoveDistance(
  from: Vector3,
  direction: Vector3,
  maxDistance: number,
  colliders: Object3D[],
  raycaster: Raycaster,
  originOffset: Readonly<[number, number, number]>
): number {
  _probeOrigin.copy(from).add(_offset.set(originOffset[0], originOffset[1], originOffset[2]))
  raycaster.near = 0
  raycaster.far = maxDistance + WALKTHROUGH_COLLISION_RADIUS
  raycaster.set(_probeOrigin, direction)

  const hits = raycaster.intersectObjects(colliders, false)
  const hit = hits.find((item) => isSolidWalkMesh(item.object) && item.distance > 1e-4)
  if (!hit) return maxDistance

  return Math.max(0, hit.distance - WALKTHROUGH_COLLISION_RADIUS - WALKTHROUGH_COLLISION_PADDING)
}

export type ResolveWalkOptions = {
  /** 贴地后附加高度：人物脚底为 0，第一人称为视高 */
  floorOffset?: number
  /** 相对脚底的碰撞探针高度 */
  probeHeights?: readonly number[]
}

/**
 * 将角色从 from 移向 to，遇墙则停在安全距离；再向下贴地。
 * `from` / `to` 均以脚底（或同高度参考）为准。
 */
export function resolveWalkthroughMove(
  from: Vector3,
  to: Vector3,
  colliders: Object3D[],
  raycaster: Raycaster,
  out: Vector3 = new Vector3(),
  options: ResolveWalkOptions = {}
): Vector3 {
  const floorOffset = options.floorOffset ?? 0
  const probeHeights = options.probeHeights ?? WALKTHROUGH_BODY_PROBE_HEIGHTS

  _moveDir.copy(to).sub(from)
  const distance = _moveDir.length()
  if (distance < 1e-6) {
    return snapToFloor(out.copy(to), colliders, raycaster, floorOffset)
  }

  _moveDir.multiplyScalar(1 / distance)

  let allowed = distance
  for (const height of probeHeights) {
    allowed = Math.min(
      allowed,
      castMoveDistance(from, _moveDir, distance, colliders, raycaster, [0, height, 0])
    )
    allowed = Math.min(
      allowed,
      castMoveDistance(from, _moveDir, distance, colliders, raycaster, [0.2, height, 0])
    )
    allowed = Math.min(
      allowed,
      castMoveDistance(from, _moveDir, distance, colliders, raycaster, [-0.2, height, 0])
    )
  }

  out.copy(from).addScaledVector(_moveDir, allowed)
  return snapToFloor(out, colliders, raycaster, floorOffset)
}

function snapToFloor(
  position: Vector3,
  colliders: Object3D[],
  raycaster: Raycaster,
  floorOffset: number
): Vector3 {
  _floorOrigin.copy(position)
  _floorOrigin.y += 0.5
  raycaster.near = 0
  raycaster.far = WALKTHROUGH_EYE_HEIGHT + 2.5
  raycaster.set(_floorOrigin, _down)

  const hits = raycaster.intersectObjects(colliders, false)
  const floorHit = hits.find((hit) => {
    if (!isSolidWalkMesh(hit.object)) return false
    return worldFaceNormalY(hit) >= WALKTHROUGH_FLOOR_NORMAL_Y
  })

  if (floorHit) {
    position.y = floorHit.point.y + floorOffset
  }
  return position
}

/**
 * 第三人称相机：贴近角色身后；人物→相机连线被墙遮挡时拉近，保证人物可见。
 */
export function resolveFollowCamera(
  characterFeet: Vector3,
  forward: Vector3,
  colliders: Object3D[],
  raycaster: Raycaster,
  out: Vector3 = new Vector3()
): Vector3 {
  const flatForward = _camDir.set(forward.x, 0, forward.z)
  if (flatForward.lengthSq() < 1e-6) {
    flatForward.set(0, 0, 1)
  } else {
    flatForward.normalize()
  }

  out
    .copy(characterFeet)
    .addScaledVector(flatForward, -WALKTHROUGH_CAMERA_DISTANCE)
  out.y = characterFeet.y + WALKTHROUGH_CAMERA_HEIGHT

  // 从胸口/头部略高处朝理想相机点打射线，检测墙体遮挡
  _camFrom.copy(characterFeet)
  _camFrom.y += WALKTHROUGH_CAMERA_LOOK_HEIGHT

  _camDir.copy(out).sub(_camFrom)
  const idealDistance = _camDir.length()
  if (idealDistance < 1e-4) return out

  _camDir.multiplyScalar(1 / idealDistance)

  if (colliders.length === 0) return out

  raycaster.near = 0.05
  raycaster.far = idealDistance
  raycaster.set(_camFrom, _camDir)

  const hits = raycaster.intersectObjects(colliders, false)
  const hit = hits.find((item) => isSolidWalkMesh(item.object) && item.distance > 0.08)
  if (!hit) return out

  const safeDistance = Math.max(
    WALKTHROUGH_CAMERA_MIN_DISTANCE,
    hit.distance - WALKTHROUGH_CAMERA_OCCLUSION_PADDING
  )
  out.copy(_camFrom).addScaledVector(_camDir, safeDistance)
  return out
}
