import { Stage } from '@react-three/drei'
import {
  GLTFExtensionsPlugin,
  ReorientationPlugin,
  TileCompressionPlugin,
  UnloadTilesPlugin,
  UpdateOnChangePlugin
} from '3d-tiles-renderer/plugins'
import { TilesPlugin, TilesRenderer } from '3d-tiles-renderer/r3f'

import {
  TILESET_CACHE_MAX_BYTES,
  TILESET_CACHE_MIN_BYTES,
  TILESET_ERROR_TARGET
} from '../constants'
import { useTilesetClick } from '../hooks/use-tileset-click'
import { useTilesetFeatureRegistry } from '../hooks/use-tileset-feature-registry'
import { useTilesetLoaders } from '../hooks/use-tileset-loaders'
import { TilesetHighlight } from './tileset-highlight'

const ENVIRONMENT_URL = '/oss/hdri/potsdamer_platz_1k.hdr'

function TilesetFeatureRegistry() {
  useTilesetFeatureRegistry()
  return null
}

export function Tileset({ url }: { url: string }) {
  const { dracoLoader, ktxLoader, meshoptDecoder } = useTilesetLoaders()
  const handleClick = useTilesetClick()

  return (
    <>
      <Stage environment={{ files: ENVIRONMENT_URL }}>
        <TilesRenderer
          url={url}
          group={{ onClick: handleClick } as never}
          errorTarget={TILESET_ERROR_TARGET}
          lruCache-minBytesSize={TILESET_CACHE_MIN_BYTES}
          lruCache-maxBytesSize={TILESET_CACHE_MAX_BYTES}
        >
          <TilesPlugin
            plugin={GLTFExtensionsPlugin}
            args={[
              {
                dracoLoader,
                ktxLoader,
                meshoptDecoder
                // metadata: true
              }
            ]}
          />
          <TilesPlugin plugin={ReorientationPlugin} args={[{ recenter: true }]} />
          {/* 压缩驻留几何（index buffer）并关闭 mipmap，显著降低海量构件内存占用 */}
          <TilesPlugin plugin={TileCompressionPlugin} />
          {/* 主动卸载视锥外瓦片，配合 LRU 字节预算控制内存 */}
          <TilesPlugin plugin={UnloadTilesPlugin} />
          {/* 配合 frameloop="demand"：仅相机/瓦片变化时才执行 update */}
          <TilesPlugin plugin={UpdateOnChangePlugin} />
          <TilesetFeatureRegistry />
        </TilesRenderer>
      </Stage>
      <TilesetHighlight />
    </>
  )
}
