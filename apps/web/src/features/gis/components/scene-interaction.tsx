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

import type { Cartesian2, Cartesian3 } from 'cesium'

export function SceneInteraction() {
  const { viewer } = useCesium()
  const activeTool = useGisStore((state) => state.activeTool)
  const setActiveTool = useGisStore((state) => state.setActiveTool)
  const addMarker = useGisStore((state) => state.addMarker)
  const markersCount = useGisStore((state) => state.markers.length)

  const roamPhase = useGisRoamStore((state) => state.phase)
  const addWaypoint = useGisRoamStore((state) => state.addWaypoint)

  // 鼠标光标状态管理：保持默认标准指针样式，避免十字加号突兀感
  useEffect(() => {
    const canvas = viewer.canvas
    if (!canvas) return
    canvas.style.cursor = 'default'
    return () => {
      canvas.style.cursor = 'default'
    }
  }, [viewer])

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

      // 优先拾取场景表面精确交点（安全捕获深度缓冲），未命中则拾取地球椭球体
      let cartesian: Cartesian3 | undefined
      try {
        if (scene.pickPositionSupported) {
          cartesian = scene.pickPosition(movement.position)
        }
      } catch {
        // 捕获可能抛出的深度纹理读取异常，继续走椭球体回退
      }

      if (!cartesian) {
        cartesian = viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid)
      }

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

      // 3. 坐标拾取模式：弹出 Toast 提示并在消息中提供手动复制按钮
      if (activeTool === 'picker') {
        const coordText = `${longitude}, ${latitude}, ${height}`
        const readable = formatCoordinates(longitude, latitude, height)

        toast.info(`已拾取坐标：${readable}`, {
          description: `经度: ${longitude}° | 纬度: ${latitude}° | 高程: ${height}m`,
          action: {
            label: '复制坐标',
            onClick: () => {
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(coordText).then(
                  () => {
                    toast.success(`已复制到剪切板：${coordText}`)
                  },
                  () => {
                    toast.error('复制失败，请检查浏览器权限')
                  }
                )
              }
            }
          },
          duration: 8000
        })
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      handler.destroy()
    }
  }, [viewer, activeTool, roamPhase, markersCount, addMarker, addWaypoint])

  return null
}
