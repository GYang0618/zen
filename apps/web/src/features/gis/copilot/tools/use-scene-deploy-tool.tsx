import { useFrontendTool } from '@copilotkit/react-core/v2'
import { Cartesian3, Math as CesiumMath } from 'cesium'
import { toast } from 'sonner'
import { z } from 'zod'

import { emptyToolRender } from '@/components/ai/empty-tool-render'

import { useCesium } from '../../cesium-provider'
import { GIS_MODEL_PATHS } from '../../constants'
import { formatCoordinates } from '../../lib/geo-utils'
import { useGisStore } from '../../stores/gis'

import type { GisDeployedCategory } from '../../stores/gis'

const categoryLabels: Record<GisDeployedCategory, string> = {
  tree: '树木',
  building: '建筑楼',
  streetlight: '路灯',
  traffic_sign: '交通标志'
}

const sceneDeploySchema = z.object({
  category: z
    .enum(['tree', 'building', 'streetlight', 'traffic_sign'])
    .describe(
      '部署的模型类别：tree(树木)、building(建筑楼)、streetlight(路灯)、traffic_sign(交通标志)'
    ),
  targetMarker: z
    .string()
    .optional()
    .describe('目标标记点的名称或ID（如"点位1"）。若用户指定在某标记点处部署，优先填入该项'),
  position: z
    .object({
      longitude: z.number().describe('经度（度）'),
      latitude: z.number().describe('纬度（度）'),
      height: z.number().optional().describe('高度（米）')
    })
    .optional()
    .describe('部署点位的绝对经纬度坐标。若未指定 targetMarker，可直接传入此坐标'),
  name: z.string().optional().describe('该模型的自定义名称或标识'),
  scale: z.number().optional().describe('模型缩放倍数，默认 1.0')
})

export function useSceneDeployTool() {
  const { viewer } = useCesium()

  useFrontendTool({
    name: 'gis_scene_deploy',
    description:
      '在三维 GIS 场景中部署三维模型。支持树木 (tree)、建筑楼 (building)、路灯 (streetlight)、交通标志 (traffic_sign) 四类模型。可通过用户标记的点位名称或直接经纬度坐标进行部署。',
    parameters: sceneDeploySchema,
    handler: async ({ category, targetMarker, position, name, scale = 1.0 }) => {
      const storedMarkers = useGisStore.getState().markers
      let deployLongitude: number | null = null
      let deployLatitude: number | null = null
      let deployHeight = 0
      let referenceName = ''

      // 1. 优先匹配标记点
      if (targetMarker) {
        const found = storedMarkers.find(
          (m) =>
            m.name.toLowerCase() === targetMarker.toLowerCase() ||
            m.name.includes(targetMarker) ||
            m.id === targetMarker
        )
        if (found) {
          deployLongitude = found.longitude
          deployLatitude = found.latitude
          deployHeight = found.height
          referenceName = found.name
        }
      }

      // 2. 其次使用传入的经纬度
      if (deployLongitude === null && position) {
        deployLongitude = position.longitude
        deployLatitude = position.latitude
        deployHeight = position.height ?? 0
      }

      // 3. 再次回退到最新标记点
      if (deployLongitude === null && storedMarkers.length > 0) {
        const latest = storedMarkers[storedMarkers.length - 1]
        deployLongitude = latest.longitude
        deployLatitude = latest.latitude
        deployHeight = latest.height
        referenceName = latest.name
      }

      // 4. 若无法定位部署点
      if (deployLongitude === null || deployLatitude === null) {
        return {
          status: 'error',
          message:
            '未找到部署位置：请在消息中指定具体经纬度坐标，或先使用底部 Dock 栏的「标记点位」功能在地图上打点。'
        }
      }

      const categoryLabel = categoryLabels[category]
      const objectName = name || `${categoryLabel}（${referenceName || '点位'}）`

      // 5. 存入全局部署模型列表
      const deployed = useGisStore.getState().addDeployedObject({
        name: objectName,
        category,
        longitude: deployLongitude,
        latitude: deployLatitude,
        height: deployHeight,
        scale,
        modelUri: GIS_MODEL_PATHS[category === 'traffic_sign' ? 'trafficSign' : category]
      })

      // 6. 相机平滑飞行动画对焦到部署目标
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          deployLongitude,
          deployLatitude,
          Math.max(deployHeight + 150, 100)
        ),
        orientation: {
          heading: viewer.camera.heading,
          pitch: CesiumMath.toRadians(-35),
          roll: 0
        },
        duration: 1.5
      })

      const coordStr = formatCoordinates(deployLongitude, deployLatitude, deployHeight)
      toast.success(`已在场景部署「${objectName}」`)

      return {
        status: 'success',
        message: `已成功在场景中部署「${objectName}」模型。位置：${coordStr}。`,
        deployedObject: {
          id: deployed.id,
          name: deployed.name,
          category: deployed.category,
          longitude: deployed.longitude,
          latitude: deployed.latitude
        }
      }
    },
    render: () => emptyToolRender()
  })
}
