import { Ion, Viewer } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { SceneLoading } from './components/scene-loading'
import { CESIUM_DEFAULT_TOKEN } from './constants'

Ion.defaultAccessToken = CESIUM_DEFAULT_TOKEN

const DEFAULT_VIEWER_OPTIONS: Viewer.ConstructorOptions = {
  animation: false,
  timeline: false,
  fullscreenButton: false,
  vrButton: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  infoBox: false,
  selectionIndicator: false
}

export type CesiumContextValue = {
  viewer: Viewer
}

const CesiumContext = createContext<CesiumContextValue | null>(null)

type CesiumProviderProps = {
  children?: React.ReactNode
  /** 仅在挂载时生效，后续变更不会重建 Viewer */
  options?: Viewer.ConstructorOptions
}

/**
 * 只管理 Viewer 生命周期与 DOM 叠加层，不把 scene / camera / entity 声明成 React 节点。
 * 场景操作一律通过 `useCesium().viewer` 走 Cesium 命令式 API。
 */
export function CesiumProvider({ children, options }: CesiumProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef(options)
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [isReady, setIsReady] = useState(false)

  optionsRef.current = options

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const creditContainer = document.createElement('div')
    creditContainer.hidden = true

    const instance = new Viewer(container, {
      ...DEFAULT_VIEWER_OPTIONS,
      creditContainer,
      ...optionsRef.current
    })
    const bottomContainer = instance.bottomContainer
    if (bottomContainer instanceof HTMLElement) {
      bottomContainer.style.display = 'none'
    }
    setViewer(instance)

    const removePostRender = instance.scene.postRender.addEventListener(() => {
      setIsReady(true)
      removePostRender()
    })

    return () => {
      removePostRender()
      setIsReady(false)
      setViewer(null)
      if (!instance.isDestroyed()) {
        instance.destroy()
      }
    }
  }, [])

  const value = useMemo(() => (viewer ? { viewer } : null), [viewer])

  return (
    <div className="relative size-full overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="application"
        aria-label="Cesium GIS 三维场景"
      />
      <SceneLoading active={!isReady} />
      {value ? (
        <CesiumContext value={value}>
          <div className="pointer-events-none absolute inset-0 z-10">{children}</div>
        </CesiumContext>
      ) : null}
    </div>
  )
}

export function useCesium() {
  const context = useContext(CesiumContext)

  if (!context) {
    throw new Error('useCesium has to be used within <CesiumProvider>')
  }

  return context
}
