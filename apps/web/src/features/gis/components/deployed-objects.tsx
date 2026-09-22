import {
  Cartesian3,
  Color,
  HeightReference,
  HorizontalOrigin,
  NearFarScalar,
  VerticalOrigin
} from 'cesium'
import { useEffect, useRef } from 'react'

import { useCesium } from '../cesium-provider'
import { GIS_MODEL_PATHS } from '../constants'
import { useGisStore } from '../stores/gis'

import type { Entity } from 'cesium'
import type { GisDeployedCategory } from '../stores/gis'

function getCategoryModelUri(category: GisDeployedCategory): string {
  switch (category) {
    case 'tree':
      return GIS_MODEL_PATHS.tree
    case 'building':
      return GIS_MODEL_PATHS.building
    case 'streetlight':
      return GIS_MODEL_PATHS.streetlight
    case 'traffic_sign':
      return GIS_MODEL_PATHS.trafficSign
  }
}

function getCategoryColor(category: GisDeployedCategory): Color {
  switch (category) {
    case 'tree':
      return Color.fromCssColorString('#22c55e')
    case 'building':
      return Color.fromCssColorString('#6366f1')
    case 'streetlight':
      return Color.fromCssColorString('#f59e0b')
    case 'traffic_sign':
      return Color.fromCssColorString('#ef4444')
  }
}

export function DeployedObjects() {
  const { viewer } = useCesium()
  const deployedObjects = useGisStore((state) => state.deployedObjects)
  const entitiesMapRef = useRef<Map<string, Entity>>(new Map())

  useEffect(() => {
    const currentMap = entitiesMapRef.current
    const incomingIds = new Set(deployedObjects.map((o) => o.id))

    // 移除已删除的对象
    for (const [id, entity] of currentMap.entries()) {
      if (!incomingIds.has(id)) {
        viewer.entities.remove(entity)
        currentMap.delete(id)
      }
    }

    // 添加新增的对象
    for (const obj of deployedObjects) {
      if (!currentMap.has(obj.id)) {
        const position = Cartesian3.fromDegrees(obj.longitude, obj.latitude, obj.height)
        const modelUri = obj.modelUri || getCategoryModelUri(obj.category)
        const color = getCategoryColor(obj.category)

        const entity = viewer.entities.add({
          name: obj.name,
          position,
          model: {
            uri: modelUri,
            minimumPixelSize: 32,
            maximumScale: 50,
            scale: obj.scale ?? 1.0,
            heightReference: HeightReference.CLAMP_TO_GROUND
          },
          // 降级兜底展示（模型未就绪时）
          point: {
            pixelSize: 8,
            color,
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            heightReference: HeightReference.CLAMP_TO_GROUND,
            scaleByDistance: new NearFarScalar(1.5e2, 1.5, 8.0e6, 0.5)
          },
          label: {
            text: obj.name,
            font: '12px PingFang SC, sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: 2,
            verticalOrigin: VerticalOrigin.BOTTOM,
            horizontalOrigin: HorizontalOrigin.CENTER,
            pixelOffset: { x: 0, y: -16 } as unknown as Cartesian3,
            heightReference: HeightReference.CLAMP_TO_GROUND,
            distanceDisplayCondition: {
              near: 0,
              far: 2000
            } as unknown as import('cesium').DistanceDisplayCondition
          }
        })

        currentMap.set(obj.id, entity)
      }
    }
  }, [viewer, deployedObjects])

  // 组件卸载时清理所有实体
  useEffect(() => {
    return () => {
      const currentMap = entitiesMapRef.current
      for (const entity of currentMap.values()) {
        viewer.entities.remove(entity)
      }
      currentMap.clear()
    }
  }, [viewer])

  return null
}
