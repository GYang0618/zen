import { Button } from '@zen/ui'
import { House } from 'lucide-react'

import { ProfileDropdown, ThemeSwitch } from '@/components'
import { Header } from '@/components/layouts'

import { useCesium } from '../cesium-provider'
import { flyToInitialView } from '../lib/fly-to-initial-view'

export function SceneHeader() {
  const { viewer } = useCesium()

  return (
    <Header className="pointer-events-auto absolute top-0 left-0 right-0">
      <div className="ms-auto flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="默认视角"
          onClick={() => flyToInitialView(viewer)}
        >
          <House className="size-5" />
        </Button>
        <ThemeSwitch />
        <ProfileDropdown />
      </div>
    </Header>
  )
}
