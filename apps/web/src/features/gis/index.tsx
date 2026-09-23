import { cn } from '@zen/ui'

import { Main } from '@/components/layouts'
import { useLayout } from '@/context/layout-provider'

import { CesiumProvider } from './cesium-provider'
import { DeployedObjects } from './components/deployed-objects'
import { MarkerOverlay } from './components/marker-overlay'
import { RoamRunner } from './components/roam-runner'
import { SceneDock } from './components/scene-dock'
import { SceneHeader } from './components/scene-header'
import { SceneInteraction } from './components/scene-interaction'
import { Copilot } from './copilot'

export { CesiumProvider } from './cesium-provider'

export function CesiumScreen() {
  const { variant } = useLayout()
  return (
    <div className={cn('h-full', variant === 'floating' && 'py-2 pr-2')}>
      <Main
        fixed
        fluid
        className={cn('h-full flex flex-1 flex-col p-0 ', variant !== 'sidebar' && 'rounded-xl')}
      >
        <div className="relative flex-1 size-full min-h-0">
          <SceneHeader />
          <CesiumProvider>
            <Copilot />
            <SceneInteraction />
            <DeployedObjects />
            <RoamRunner />
            <MarkerOverlay />
            <SceneDock />
          </CesiumProvider>
        </div>
      </Main>
    </div>
  )
}
