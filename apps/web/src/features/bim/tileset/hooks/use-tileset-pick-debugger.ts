import { useEffect } from 'react'

import { installTilesetPickDebugger } from '../lib/debug-tileset-pick'

/** DEV：挂载 window.__tilesetDebug，卸载时清理 */
export function useTilesetPickDebugger(): void {
  useEffect(() => {
    if (!import.meta.env.DEV) return
    return installTilesetPickDebugger()
  }, [])
}
