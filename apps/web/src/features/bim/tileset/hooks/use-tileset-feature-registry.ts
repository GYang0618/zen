import { TilesRendererContext } from '3d-tiles-renderer/r3f'
import { useContext, useEffect } from 'react'

import { tilesetFeatureRegistry } from '../lib/feature-registry'

import type { Object3D } from 'three'

interface TileModelEvent {
  scene: Object3D
}

/** 瓦片加载/卸载时同步 feature 索引，供构件级高亮查询 */
export function useTilesetFeatureRegistry(): void {
  const tiles = useContext(TilesRendererContext)

  useEffect(() => {
    if (!tiles) return

    const cleanups = new Map<Object3D, () => void>()

    const onLoadModel = ({ scene }: TileModelEvent) => {
      if (cleanups.has(scene)) return
      cleanups.set(scene, tilesetFeatureRegistry.registerFromRoot(scene))
    }

    const onDisposeModel = ({ scene }: TileModelEvent) => {
      cleanups.get(scene)?.()
      cleanups.delete(scene)
    }

    tiles.addEventListener('load-model', onLoadModel)
    tiles.addEventListener('dispose-model', onDisposeModel)

    return () => {
      tiles.removeEventListener('load-model', onLoadModel)
      tiles.removeEventListener('dispose-model', onDisposeModel)
      for (const cleanup of cleanups.values()) cleanup()
      cleanups.clear()
    }
  }, [tiles])
}
