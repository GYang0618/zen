import { Bounds, Bvh, Center, useGLTF } from '@react-three/drei'
import { useCallback, useEffect, useMemo } from 'react'

import { bimMeshRegistry } from '../lib/mesh-registry'
import {
  getObjectId,
  getObjectKind,
  getObjectUserData,
  isObjectSelectable
} from '../lib/object'
import { useBimStore } from '../stores/bim'

import type { ThreeEvent } from '@react-three/fiber'
import type { Object3D } from 'three'
import type { BimModelInstance } from '../stores/bim'

type BimModelProps = Pick<BimModelInstance, 'id' | 'url' | 'position'>

const FRAME_MARGIN = 1.35
const FRAME_DURATION_SEC = 0.9

function modelNameFromUrl(url: string) {
  const segment = url.split('/').pop() ?? url
  return segment.split('?')[0].split('#')[0]
}

export function BIMModel({ id, url, position }: BimModelProps) {
  const { scene } = useGLTF(url)
  const selectElement = useBimStore((state) => state.selectElement)

  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.name = modelNameFromUrl(url)
    clone.userData = { id, url, position }
    return clone
  }, [scene, id, url, position])

  useEffect(() => bimMeshRegistry.registerFromRoot(model), [model])

  const pickTargetObject = useCallback((event: ThreeEvent<PointerEvent>): Object3D | null => {
    const wantKind = event.nativeEvent.altKey ? 'space' : 'element'
    const intersections = event.intersections ?? []
    // 找到第一个符合条件的对象
    const hit = intersections.find(({ object }) => {
      if (!isObjectSelectable(object)) return false
      const userData = getObjectUserData(object)
      return getObjectKind(userData) === wantKind
    })
    return hit?.object ?? null
  }, [])

  const handleClick = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (event.button !== 0) return
      if (event.delta > 5) return
      const target = pickTargetObject(event)
      console.log('🚀 ~ BimModel ~ target:', target)
      if (!target) return
      event.stopPropagation()
      const elementId = getObjectId(target)
      selectElement(elementId, { multi: event.shiftKey })
    },
    [pickTargetObject, selectElement]
  )

  return (
    <group position={position}>
      <Bounds fit clip observe margin={FRAME_MARGIN} maxDuration={FRAME_DURATION_SEC}>
        <Center top>
          <Bvh firstHitOnly={false}>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: R3F primitive uses pointer event system */}
            <primitive object={model} onClick={handleClick} />
          </Bvh>
        </Center>
      </Bounds>
    </group>
  )
}
