import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'

import { handleBimPointerClick } from '../lib/pick'
import { useModelStore } from '../stores/model'

import type { ThreeEvent } from '@react-three/fiber'

/** 左键拾取构件并刷新 demand 渲染 */
export function useBimClick() {
  const selectElement = useModelStore((state) => state.selectElement)
  const invalidate = useThree((state) => state.invalidate)

  return useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      handleBimPointerClick(event, selectElement)
      invalidate()
    },
    [selectElement, invalidate]
  )
}
