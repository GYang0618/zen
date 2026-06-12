import { Bounds, Bvh, Center, useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'

import { useBimClick } from '../hooks/use-bim-click'
import { bimMeshRegistry } from '../lib/mesh-registry'

import type { BimModelInstance } from '../stores/model'

type BimModelProps = Pick<BimModelInstance, 'id' | 'url' | 'position'>

useGLTF.setDecoderPath('/oss/draco/')

const FRAME_MARGIN = 1.35
const FRAME_DURATION_SEC = 0.9

function modelNameFromUrl(url: string) {
  const segment = url.split('/').pop() ?? url
  return segment.split('?')[0].split('#')[0]
}

export function BIMModel({ id, url, position }: BimModelProps) {
  const { scene } = useGLTF(url)
  const handleClick = useBimClick()

  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.name = modelNameFromUrl(url)
    clone.userData = { id, url, position }
    return clone
  }, [scene, id, url, position])

  useEffect(() => bimMeshRegistry.registerFromRoot(model), [model])

  return (
    <group position={position}>
      <Bounds fit clip margin={FRAME_MARGIN} maxDuration={FRAME_DURATION_SEC}>
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
