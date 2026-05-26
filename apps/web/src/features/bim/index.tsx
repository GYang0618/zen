import { Suspense } from 'react'

import { Main } from '@/components/layouts'

import { BimModel } from './components/bim-model'
import { BimScene } from './components/bim-scene'

export function BIMScreen() {
  return (
    <Main fixed fluid className="flex flex-1 flex-col p-0 rounded-xl">
      <div className="relative size-full">
        <BimScene>
          <Suspense fallback={null}>
            <BimModel />
          </Suspense>
        </BimScene>
      </div>
    </Main>
  )
}
