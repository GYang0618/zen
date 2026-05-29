import { Suspense } from 'react'

import { Main } from '@/components/layouts'

import { BIMModel } from './components/model'
import { Scene } from './components/scene'
import { Copilot } from './copilot'
import { useModelStore } from './stores/model'

export function BIMScreen() {
  const modelInstances = useModelStore((state) => state.modelInstances)

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
        </Scene>
      </div>
    </Main>
  )
}
