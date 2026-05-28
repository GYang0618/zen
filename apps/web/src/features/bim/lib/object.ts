import { IFC_TYPE_MAP } from '../constants'

import type { Mesh, Object3D, Scene } from 'three'

export type KindType = 'space' | 'element'

export function getObjectUserData<
  UserData extends Record<string, unknown> = Record<string, unknown>
>(object: Object3D): UserData {
  const { gltfExtensions, ...rest } = object.userData
  return { ...rest, ...gltfExtensions } as UserData
}

export function getObjectKind(userData: Record<string, unknown>): KindType {
  return userData.IfcEntity === IFC_TYPE_MAP.IfcSpace.value ? 'space' : 'element'
}

export function isObjectSelectable(object: Object3D): boolean {
  return (object as Mesh).isMesh === true
}

export function getObjectId(object: Object3D): string {
  const { id } = getObjectUserData(object)
  return typeof id === 'string' && id.length > 0 ? id : object.uuid
}

export function findObjectById(scene: Scene, id: string): Object3D | null {
  let found: Object3D | null = null
  scene.traverse((object) => {
    if (getObjectId(object) === id) found = object
  })
  return found
}
