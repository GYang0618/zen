import {
  ArcGisMapServerImageryProvider,
  Cartesian3,
  Math as CesiumMath,
  Color,
  EasingFunction,
  ImageryLayer,
  Ion,
  OpenStreetMapImageryProvider,
  Terrain,
  Viewer,
  WebMapTileServiceImageryProvider
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { SceneLoading } from './components/scene-loading'
import {
  CESIUM_DEFAULT_TOKEN,
  GIS_GLOBAL_OVERVIEW_VIEW,
  GIS_INITIAL_VIEW,
  TIANDITU_SUBDOMAINS,
  TIANDITU_TOKEN,
  TIANDITU_WMTS_URLS
} from './constants'

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
  baseLayerPicker: false, // 禁用地图选择器/pick器 (BaseLayerPicker)
  baseLayer: false // 关闭默认底图，由 setupBaseLayer 统一接入天地图
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
 * 异步初始化天地图高可用全球影像底图及注记图层
 * 优先采用国家地理信息公共服务平台（天地图）WMTS 影像及注记；若失败自动降级为 ArcGIS/OSM
 */
async function setupBaseLayer(viewer: Viewer) {
  try {
    const imgProvider = new WebMapTileServiceImageryProvider({
      url: `${TIANDITU_WMTS_URLS.imagery}?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TIANDITU_TOKEN}`,
      layer: 'img',
      style: 'default',
      format: 'tiles',
      tileMatrixSetID: 'w',
      subdomains: [...TIANDITU_SUBDOMAINS],
      maximumLevel: 18
    })

    const ciaProvider = new WebMapTileServiceImageryProvider({
      url: `${TIANDITU_WMTS_URLS.annotation}?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TIANDITU_TOKEN}`,
      layer: 'cia',
      style: 'default',
      format: 'tiles',
      tileMatrixSetID: 'w',
      subdomains: [...TIANDITU_SUBDOMAINS],
      maximumLevel: 18
    })

    if (!viewer.isDestroyed()) {
      viewer.imageryLayers.removeAll()
      viewer.imageryLayers.add(new ImageryLayer(imgProvider))
      viewer.imageryLayers.add(new ImageryLayer(ciaProvider))
      return
    }
  } catch (err) {
    console.warn('[Cesium] 天地图底图加载失败，尝试降级为 ArcGIS 卫星影像:', err)
  }

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
      terrain: Terrain.fromWorldTerrain({
        requestWaterMask: true,
        requestVertexNormals: true
      }),
      creditContainer,
      ...optionsRef.current
    })

    // 隐藏底部默认版权容器
    const bottomContainer = instance.bottomContainer
    if (bottomContainer instanceof HTMLElement) {
      bottomContainer.style.display = 'none'
    }

    // 启用三维地形深度检测，保证山体起伏遮挡真实准确
    instance.scene.globe.depthTestAgainstTerrain = true

    // 优化地球光照与大气渲染参数，保证地球清晰明亮、不发黑
    instance.scene.globe.baseColor = Color.fromCssColorString('#0f172a')
    instance.scene.globe.enableLighting = false
    instance.scene.globe.showGroundAtmosphere = true

    // 初始视角：先置于太空全景，等待场景就绪后以 flyTo 平滑俯冲定位至南京
    instance.camera.setView({
      destination: Cartesian3.fromDegrees(
        GIS_GLOBAL_OVERVIEW_VIEW.longitude,
        GIS_GLOBAL_OVERVIEW_VIEW.latitude,
        GIS_GLOBAL_OVERVIEW_VIEW.height
      )
    })

    // 异步挂载高可用底图影像
    setupBaseLayer(instance)

    setViewer(instance)

    const removePostRender = instance.scene.postRender.addEventListener(() => {
      setIsReady(true)
      removePostRender()

      // 场景首帧渲染就绪后，平滑 flyTo 飞行定位至南京初始视角
      if (!instance.isDestroyed()) {
        instance.camera.flyTo({
          destination: Cartesian3.fromDegrees(
            GIS_INITIAL_VIEW.longitude,
            GIS_INITIAL_VIEW.latitude,
            GIS_INITIAL_VIEW.height
          ),
          orientation: {
            heading: CesiumMath.toRadians(GIS_INITIAL_VIEW.headingDeg),
            pitch: CesiumMath.toRadians(GIS_INITIAL_VIEW.pitchDeg),
            roll: CesiumMath.toRadians(GIS_INITIAL_VIEW.rollDeg)
          },
          duration: GIS_INITIAL_VIEW.flyDurationSec,
          easingFunction: EasingFunction.QUADRATIC_IN_OUT
        })
      }
    })

    return () => {
      removePostRender()
      setIsReady(false)
      setViewer(null)
      if (!instance.isDestroyed()) {
        instance.camera.cancelFlight()
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
