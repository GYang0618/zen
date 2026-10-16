import { useEffect } from 'react'

import { useGisRoamStore } from '../stores/gis-roam'

/** 漫游进行中的快捷键：空格暂停/继续，R 重开，V 视角，M 倍速，[ ] 调速，\ 恢复巡航。 */
export function useRoamHotkeys(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      ) {
        return
      }

      const store = useGisRoamStore.getState()
      if (event.code === 'Space') {
        event.preventDefault()
        if (store.phase === 'roaming') store.pauseRoam()
        else if (store.phase === 'paused') store.resumeRoam()
        return
      }
      if (event.key === 'r' || event.key === 'R') store.restartRoam()
      else if (event.key === 'v' || event.key === 'V') store.toggleViewMode()
      else if (event.key === 'm' || event.key === 'M') store.cycleSpeedMultiplier()
      else if (event.key === '[') store.speedDown()
      else if (event.key === ']') store.speedUp()
      else if (event.key === '\\') store.resetSpeed()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
