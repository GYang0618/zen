import { Main } from '@/components/layouts'

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
  return (
    <Main fixed fluid className="flex flex-1 flex-col p-0 rounded-xl">
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
  )
}
