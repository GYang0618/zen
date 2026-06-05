import { useThree } from '@react-three/fiber'
import { EffectComposer, Outline } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import { useEffect, useMemo } from 'react'
import { AdditiveBlending, DoubleSide } from 'three'

import { tilesetFeatureRegistry } from '../lib/feature-registry'
import { useTilesetSelectionStore } from '../stores/selection'

const OUTLINE = {
  blendFunction: BlendFunction.ADD,
  edgeStrength: 10,
  visibleEdgeColor: 0x67e8f9,
  hiddenEdgeColor: 0x0891b2,
  kernelSize: KernelSize.VERY_SMALL,
  blur: false
} as const

const FILL = {
  color: 0x00e5ff,
  opacity: 0.2
} as const

/** 3D Tiles 构件级高亮：feature 子几何 + Outline 描边 */
export function TilesetHighlight() {
  const selectedElementIds = useTilesetSelectionStore((state) => state.selectedElementIds)
  const invalidate = useThree((state) => state.invalidate)

  const selection = useMemo(
    () => tilesetFeatureRegistry.getHighlightMeshes(selectedElementIds),
    [selectedElementIds]
  )

  useEffect(() => {
    return useTilesetSelectionStore.subscribe((state, prevState) => {
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
      <EffectComposer multisampling={0} autoClear={false}>
        <Outline
          selection={selection}
          blendFunction={OUTLINE.blendFunction}
          edgeStrength={OUTLINE.edgeStrength}
          pulseSpeed={0}
          visibleEdgeColor={OUTLINE.visibleEdgeColor}
          hiddenEdgeColor={OUTLINE.hiddenEdgeColor}
          kernelSize={OUTLINE.kernelSize}
          blur={OUTLINE.blur}
          xRay={false}
        />
      </EffectComposer>
      <group renderOrder={999}>
        {selection.map((mesh) => (
          <mesh
            key={mesh.uuid}
            geometry={mesh.geometry}
            matrix={mesh.matrix}
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
