import { cn } from '@zen/ui'
import { Suspense } from 'react'

import { Main } from '@/components/layouts'
import { useLayout } from '@/context/layout-provider'

import { BIMModel } from './components/model'
import { Scene } from './components/scene'
import { Copilot } from './copilot'
import { useModelStore } from './stores/model'

export function BIMScreen() {
  const modelInstances = useModelStore((state) => state.modelInstances)
  const { variant } = useLayout()
  return (
    <div className={cn('h-full', variant === 'floating' && 'py-2 pr-2')}>
      <Main
        fixed
        fluid
        className={cn(
          'flex flex-1 flex-col p-0 rounded-xl h-full',
          variant !== 'sidebar' && 'rounded-xl'
        )}
      >
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
    </div>
  )
}
