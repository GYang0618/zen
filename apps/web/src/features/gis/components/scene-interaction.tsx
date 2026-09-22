import {
  Cartographic,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType
} from 'cesium'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { useCesium } from '../cesium-provider'
import { formatCoordinates } from '../lib/geo-utils'
import { useGisStore } from '../stores/gis'
import { useGisRoamStore } from '../stores/gis-roam'

import type { Cartesian2 } from 'cesium'

export function SceneInteraction() {
  const { viewer } = useCesium()
  const activeTool = useGisStore((state) => state.activeTool)
  const setActiveTool = useGisStore((state) => state.setActiveTool)
  const addMarker = useGisStore((state) => state.addMarker)
  const markersCount = useGisStore((state) => state.markers.length)

  const roamPhase = useGisRoamStore((state) => state.phase)
  const addWaypoint = useGisRoamStore((state) => state.addWaypoint)

  // 鼠标光标状态管理：激活标记或拾取时显示 crosshair（加号）
  useEffect(() => {
    const canvas = viewer.canvas
    if (!canvas) return

    const isCrosshair =
      activeTool === 'marker' || activeTool === 'picker' || roamPhase === 'picking'
    if (isCrosshair) {
      canvas.style.cursor = 'crosshair'
    } else {
      canvas.style.cursor = 'default'
    }

    return () => {
      canvas.style.cursor = 'default'
    }
  }, [viewer, activeTool, roamPhase])

  // ESC 键退出激活模式
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeTool !== 'none') {
          setActiveTool('none')
          toast.info('已退出交互模式')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTool, setActiveTool])

  // 注册 Cesium 点击事件监听
  useEffect(() => {
    const scene = viewer.scene
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)

    handler.setInputAction((movement: { position: Cartesian2 }) => {
      if (activeTool === 'none' && roamPhase !== 'picking') {
        return
      }

      // 优先拾取场景表面精确交点，未命中则拾取地球椭球体
      const cartesian =
        scene.pickPosition(movement.position) ??
        viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid)

      if (!cartesian) {
        return
      }

      const cartographic = Cartographic.fromCartesian(cartesian)
      const longitude = Number(CesiumMath.toDegrees(cartographic.longitude).toFixed(6))
      const latitude = Number(CesiumMath.toDegrees(cartographic.latitude).toFixed(6))
      const height = Number((cartographic.height ?? 0).toFixed(2))

      // 1. 漫游拾取航路点
      if (roamPhase === 'picking') {
        addWaypoint({
          longitude,
          latitude,
          height,
          name: `航路点 ${useGisRoamStore.getState().waypoints.length + 1}`
        })
        toast.success(`已添加漫游点 (${longitude}°, ${latitude}°)`)
        return
      }

      // 2. 标记模式：打点并生成 label
      if (activeTool === 'marker') {
        const nextIndex = markersCount + 1
        const defaultName = `点位 ${nextIndex}`
        const created = addMarker({
          name: defaultName,
          longitude,
          latitude,
          height
        })
        toast.success(`已创建标记「${created.name}」，双击标签可修改名称`)
        return
      }

      // 3. 坐标拾取模式：拾取坐标并自动复制到剪切板
      if (activeTool === 'picker') {
        const coordText = `${longitude}, ${latitude}, ${height}`
        const readable = formatCoordinates(longitude, latitude, height)

        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(coordText).then(
            () => {
              toast.success(`坐标已复制到剪切板：${readable}`)
            },
            () => {
              toast.info(`拾取坐标：${readable}`)
            }
          )
        } else {
          toast.info(`拾取坐标：${readable}`)
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      handler.destroy()
    }
  }, [viewer, activeTool, roamPhase, markersCount, addMarker, addWaypoint])

  return null
}
