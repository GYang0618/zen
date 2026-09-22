import {
  ArcGisMapServerImageryProvider,
  Cartesian3,
  Color,
  ImageryLayer,
  Ion,
  OpenStreetMapImageryProvider,
  Viewer
} from 'cesium'
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
  selectionIndicator: false,
  baseLayer: false // 禁用默认的 Bing Maps 请求（已退役且国内无法直连），由 setupBaseLayer 统一管理
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
 * 异步初始化高可用全球影像底图
 * 优先采用免 Token、全球高速 CDN 的 ArcGIS 卫星影像；若失败自动降级为 OpenStreetMap
 */
async function setupBaseLayer(viewer: Viewer) {
  try {
    const arcgisProvider = await ArcGisMapServerImageryProvider.fromUrl(
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
      { enablePickFeatures: false }
    )
    if (!viewer.isDestroyed()) {
      viewer.imageryLayers.removeAll()
      viewer.imageryLayers.add(new ImageryLayer(arcgisProvider))
      return
    }
  } catch (err) {
    console.warn('[Cesium] ArcGIS 影像底图加载失败，尝试降级为 OpenStreetMap:', err)
  }

  try {
    const osmProvider = new OpenStreetMapImageryProvider({
      url: 'https://tile.openstreetmap.org/'
    })
    if (!viewer.isDestroyed()) {
      viewer.imageryLayers.removeAll()
      viewer.imageryLayers.add(new ImageryLayer(osmProvider))
      return
    }
  } catch (err) {
    console.warn('[Cesium] OpenStreetMap 影像底图加载失败:', err)
  }
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

    // 隐藏底部默认版权容器
    const bottomContainer = instance.bottomContainer
    if (bottomContainer instanceof HTMLElement) {
      bottomContainer.style.display = 'none'
    }

    // 优化地球光照与大气渲染参数，保证地球清晰明亮、不发黑
    instance.scene.globe.baseColor = Color.fromCssColorString('#0f172a')
    instance.scene.globe.enableLighting = false
    instance.scene.globe.showGroundAtmosphere = true

    // 默认视角：俯瞰全景（中国及欧亚大陆中心）
    instance.camera.setView({
      destination: Cartesian3.fromDegrees(108.5, 34.0, 14000000)
    })

    // 异步挂载高可用底图影像
    setupBaseLayer(instance)

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
    <div className="relative flex-1 size-full min-h-0 overflow-hidden">
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
