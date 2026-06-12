import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'

import { handleTilesetPointerClick } from '../lib/pick'
import { useTilesetSelectionStore } from '../stores/selection'

import type { ThreeEvent } from '@react-three/fiber'

/** 左键拾取 3D Tiles 构件（feature 级）并刷新 demand 渲染 */
export function useTilesetClick() {
  const selectElement = useTilesetSelectionStore((state) => state.selectElement)
  const invalidate = useThree((state) => state.invalidate)

  return useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const { meshFeatures, structuralMetadata } = event.object.userData

      const picked = handleTilesetPointerClick(event, selectElement)
      console.log('🚀 ~ useTilesetClick ~ picked:', picked?.properties)

      const { propertyTable } = meshFeatures?.featureIds[0] ?? {}
      const properties = structuralMetadata?.getPropertyTableData(propertyTable, picked?.featureId)
      console.log('🚀 ~ useTilesetClick ~ properties:', properties)
      invalidate()
    },
    [selectElement, invalidate]
  )
}
