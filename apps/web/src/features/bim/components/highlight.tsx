import { useThree } from '@react-three/fiber'
import { EffectComposer, Outline } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import { useEffect, useMemo } from 'react'
import { AdditiveBlending, DoubleSide } from 'three'

import { bimMeshRegistry } from '../lib/mesh-registry'
import { useModelStore } from '../stores/model'

const OUTLINE = {
  blendFunction: BlendFunction.ADD,
  edgeStrength: 10,
  visibleEdgeColor: 0x67e8f9,
  hiddenEdgeColor: 0x0891b2,
  kernelSize: KernelSize.VERY_SMALL,
  blur: true
} as const

const FILL = {
  color: 0x00e5ff,
  opacity: 0.2
} as const

/** 受控高亮：Outline 描边 + 半透明填充 */
export function Highlight() {
  const selectedElementIds = useModelStore((state) => state.selectedElementIds)
  const invalidate = useThree((state) => state.invalidate)

  const selection = useMemo(
    () => bimMeshRegistry.getMeshes(selectedElementIds),
    [selectedElementIds]
  )

  useEffect(() => {
    return useModelStore.subscribe((state, prevState) => {
      if (state.selectedElementIds !== prevState.selectedElementIds) {
        invalidate()
      }
    })
  }, [invalidate])

  if (selection.length === 0) {
    return null
  }

  return (
    <>
      <EffectComposer multisampling={8} autoClear={false}>
        <Outline
          selection={selection}
          blendFunction={OUTLINE.blendFunction}
          edgeStrength={OUTLINE.edgeStrength}
          pulseSpeed={0}
          visibleEdgeColor={OUTLINE.visibleEdgeColor}
          hiddenEdgeColor={OUTLINE.hiddenEdgeColor}
          kernelSize={OUTLINE.kernelSize}
          blur={OUTLINE.blur}
          xRay
        />
      </EffectComposer>
      <group renderOrder={999}>
        {selection.map((mesh) => (
          <mesh
            key={mesh.uuid}
            geometry={mesh.geometry}
            matrix={mesh.matrixWorld}
            matrixAutoUpdate={false}
            frustumCulled={false}
            renderOrder={999}
          >
            <meshBasicMaterial
              color={FILL.color}
              transparent
              opacity={FILL.opacity}
              depthTest={false}
              depthWrite={false}
              blending={AdditiveBlending}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </>
  )
}
