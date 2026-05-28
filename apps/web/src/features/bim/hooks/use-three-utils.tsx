import { useThree } from '@react-three/fiber'

import type { Object3D } from 'three'

export function useThreeUtils() {
  const scene = useThree((state) => state.scene)

  const find = (fn: (object: Object3D) => boolean): Object3D | null => {
    let found: Object3D | null = null
    scene.traverse((object) => {
      if (fn(object)) found = object
    })
    return found
  }

  return {
    find
  }
}
