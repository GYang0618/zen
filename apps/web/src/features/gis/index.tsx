import { Main } from '@/components/layouts'

import { CesiumProvider } from './cesium-provider'
import { SceneDock } from './components/scene-dock'

export { CesiumProvider } from './cesium-provider'

export function CesiumScreen() {
  return (
    <Main fixed fluid className="flex flex-1 flex-col p-0 rounded-xl">
      <CesiumProvider>
        <SceneDock />
      </CesiumProvider>
    </Main>
  )
}
