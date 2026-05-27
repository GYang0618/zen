import type { Object3D, Scene } from 'three'

/** 在 R3F 场景图中按 userData.id 查找对象（Three.js scene.traverse） */
export function findObjectByUserDataId(scene: Scene, id: string): Object3D | null {
  let found: Object3D | null = null
  scene.traverse((object) => {
    if (object.userData?.id === id) found = object
  })
  return found
}
