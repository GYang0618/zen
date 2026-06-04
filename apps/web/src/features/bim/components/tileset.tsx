import { GLTFExtensionsPlugin, ReorientationPlugin } from '3d-tiles-renderer/plugins'
import { TilesPlugin, TilesRenderer } from '3d-tiles-renderer/r3f'

import { useBimClick } from '../hooks/use-bim-click'
import { useTilesetLoaders } from '../hooks/use-tileset-loaders'
import { useTilesetMeshRegistry } from '../hooks/use-tileset-mesh-registry'

const TEST_URL = '/models/bim/tileset.json'

function TilesetInteraction() {
  useTilesetMeshRegistry()
  return null
}

export function Tileset({ url = TEST_URL }: { url?: string }) {
  const { dracoLoader, ktxLoader, meshoptDecoder } = useTilesetLoaders()
  const handleClick = useBimClick()

  return (
    <TilesRenderer url={url} group={{ onClick: handleClick } as never}>
      <TilesPlugin
        plugin={GLTFExtensionsPlugin}
        args={[{ dracoLoader, ktxLoader, meshoptDecoder }]}
      />
      <TilesPlugin plugin={ReorientationPlugin} args={[{ recenter: true }]} />
      <TilesetInteraction />
    </TilesRenderer>
  )
}
