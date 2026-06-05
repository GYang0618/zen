import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'

export interface TilesetLoaders {
  dracoLoader: DRACOLoader
  ktxLoader: KTX2Loader
  meshoptDecoder: typeof MeshoptDecoder
}

const DECODER_PATHS = {
  draco: '/draco/',
  ktx2: '/basis/'
}

export function useTilesetLoaders(): TilesetLoaders {
  const gl = useThree((state) => state.gl)

  const loaders = useMemo<TilesetLoaders>(() => {
    const dracoLoader = new DRACOLoader()
      .setDecoderPath(DECODER_PATHS.draco)
      .setDecoderConfig({ type: 'js' })

    const ktxLoader = new KTX2Loader().setTranscoderPath(DECODER_PATHS.ktx2).detectSupport(gl)

    return { dracoLoader, ktxLoader, meshoptDecoder: MeshoptDecoder }
  }, [gl])

  useEffect(() => {
    return () => {
      loaders.dracoLoader.dispose()
      loaders.ktxLoader.dispose()
    }
  }, [loaders])

  return loaders
}
