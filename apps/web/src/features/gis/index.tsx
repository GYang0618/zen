import { Main } from '@/components/layouts'

import { Scene } from './components/viewer'

export function CesiumScreen() {
  return (
    <Main fixed fluid className="flex flex-1 flex-col p-0 rounded-xl">
      <Scene />
    </Main>
  )
}
