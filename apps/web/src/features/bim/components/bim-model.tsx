import { Bounds, Center, useGLTF } from '@react-three/drei'
import { useMemo } from 'react'

import type { BimModelInstance } from '../stores/bim-store'

type BimModelProps = Pick<BimModelInstance, 'id' | 'url' | 'position'>

const FRAME_MARGIN = 1.35
const FRAME_DURATION_SEC = 0.9

function modelNameFromUrl(url: string) {
  const segment = url.split('/').pop() ?? url
  return segment.split('?')[0].split('#')[0]
}

export function BimModel({ id, url, position }: BimModelProps) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.name = modelNameFromUrl(url)
    clone.userData = { id, url, position }
    return clone
  }, [scene, id, url, position])

  return (
    <group position={position}>
      <Bounds fit clip observe margin={FRAME_MARGIN} maxDuration={FRAME_DURATION_SEC}>
        <Center top>
          <primitive object={model} />
        </Center>
      </Bounds>
    </group>
  )
}
