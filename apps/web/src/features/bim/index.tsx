import { Suspense, useState } from 'react'

import { Main } from '@/components/layouts'

import { BIMModel } from './components/model'
import { Scene } from './components/scene'
import { Copilot } from './copilot'
import { useModelStore } from './stores/model'
import { Tileset } from './tileset'

export function BIMScreen() {
  const modelInstances = useModelStore((state) => state.modelInstances)
  const [tilesetUrls] = useState<string[]>([
    '/oss/models/bim-ifc/demo1/tileset.json',
    '/oss/models/bim-ifc/demo2/tileset.json'

    // '/oss/models/plumb/tileset.json'
  ])
  return (
    <Main fixed fluid className="flex flex-1 flex-col p-0 rounded-xl">
      <div className="relative size-full">
        <Scene>
          <Copilot />
          {modelInstances.map((instance) => (
            <Suspense key={instance.id} fallback={null}>
              <BIMModel {...instance} />
            </Suspense>
          ))}
          {tilesetUrls.map((url) => (
            <Tileset key={url} url={url} />
          ))}
        </Scene>
      </div>
    </Main>
  )
}
