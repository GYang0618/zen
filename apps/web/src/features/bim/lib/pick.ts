import { bimMeshRegistry } from './mesh-registry'
import { getObjectId, getObjectKind, getObjectUserData, isObjectSelectable } from './object'

import type { ThreeEvent } from '@react-three/fiber'
import type { Mesh, Object3D } from 'three'

const DRAG_THRESHOLD_PX = 5

export function pickSelectableObject(event: ThreeEvent<PointerEvent>): Object3D | null {
  const wantKind = event.nativeEvent.altKey ? 'space' : 'element'
  const intersections = event.intersections ?? []

  const hit = intersections.find(({ object }) => {
    if (!isObjectSelectable(object)) return false
    const userData = getObjectUserData(object)
    return getObjectKind(userData) === wantKind
  })

  return hit?.object ?? null
}

export function registerPickTarget(object: Object3D): void {
  if (!(object as Mesh).isMesh) return
  bimMeshRegistry.registerMesh(object as Mesh)
}

type SelectElement = (id: string, options?: { multi?: boolean; append?: boolean }) => void

/** BIM 场景统一左键拾取：注册 mesh → 写入选中 store */
export function handleBimPointerClick(
  event: ThreeEvent<PointerEvent>,
  selectElement: SelectElement
): void {
  if (event.button !== 0) return
  if (event.delta > DRAG_THRESHOLD_PX) return

  const target = pickSelectableObject(event)
  if (!target) return

  event.stopPropagation()
  registerPickTarget(target)
  selectElement(getObjectId(target), { multi: event.shiftKey })
}
