import { Suspense } from 'react'

import { Main } from '@/components/layouts'

import { BimModel } from './components/bim-model'
import { BimScene } from './components/bim-scene'
import { BimSceneTools } from './components/bim-scene-tools'
import { useBimAgentContext } from './hooks/use-bim-agent-context'
import { useBimStore } from './stores/bim-store'

export function BIMScreen() {
  useBimAgentContext()

  const modelInstances = useBimStore((state) => state.modelInstances)

  return (
    <Main fixed fluid className="flex flex-1 flex-col p-0 rounded-xl">
      <div className="relative size-full">
        <BimScene>
          <BimSceneTools />
          {modelInstances.map((instance) => (
            <Suspense key={instance.id} fallback={null}>
              <BimModel {...instance} />
            </Suspense>
          ))}
        </BimScene>
      </div>
    </Main>
  )
}
