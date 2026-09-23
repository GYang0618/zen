import { useFrontendTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

import { emptyToolRender } from '@/components/ai/empty-tool-render'

import { GIS_ROAM_MIN_WAYPOINTS } from '../../constants'
import {
  calculateTotalPathDistance,
  formatDistance,
  resolveVehicleByDistance
} from '../../lib/geo-utils'
import { useGisStore } from '../../stores/gis'
import { useGisRoamStore } from '../../stores/gis-roam'
import { WaypointCollectPanel } from '../components/waypoint-collect-panel'

import type { GisWaypoint } from '../../stores/gis-roam'

const pointSchema = z.object({
  longitude: z.number().describe('点位经度（度）'),
  latitude: z.number().describe('点位纬度（度）'),
  height: z.number().optional().describe('点位高度（米），若省略自动按地表/地形高度计算'),
  name: z.string().optional().describe('点位名称')
})

const gisRoamSchema = z.object({
  waypoints: z
    .array(pointSchema)
    .optional()
    .describe(
      `有序漫游航路点列表（至少 ${GIS_ROAM_MIN_WAYPOINTS} 个）。若用户在对话中给出了点位或引用了标记点，请传入此参数；若用户未提供，请省略此参数，系统将自动使用已标记的点位或弹出点位拾取面板引导用户点选。`
    ),
  vehicle: z
    .enum(['auto', 'walk', 'vehicle', 'plane'])
    .optional()
    .describe(
      '漫游载具类型，默认 auto（根据总距离自动推断：<=2km步行、2km~100km车辆、>100km飞机空中漫游）'
    ),
  viewMode: z
    .enum(['first_person', 'third_person'])
    .optional()
    .describe(
      '漫游视角模式：first_person（第一人称主观视角：车辆前行可看车头，飞机可看机头，步行真实模拟步态起伏），third_person（第三人称跟随视角），若省略默认按当前状态或第一人称启动'
    ),
  targetSpeedKmh: z
    .number()
    .optional()
    .describe(
      '指定目标巡航时速（km/h）。若省略自动使用该载具的标准巡航时速（步行 5 km/h，车辆 60 km/h，飞机 800 km/h）。漫游统一从 0 km/h 起步平滑加速至该目标速度'
    )
})

function normalizeWaypoints(waypoints: z.infer<typeof gisRoamSchema>['waypoints']): GisWaypoint[] {
  if (!waypoints) return []
  return waypoints.map((pt, idx) => ({
    longitude: pt.longitude,
    latitude: pt.latitude,
    height: pt.height,
    name: pt.name || `航路点 ${idx + 1}`
  }))
}

export function useGisRoamTool() {
  useFrontendTool({
    name: 'gis_roam',
    description:
      '启动三维 GIS 场景漫游。优先使用消息中指定的点位或场景中用户已打下的标记点；若未指定且无标记点，将调出拾取面板由用户在地图上点选。支持第一人称（沉浸式座舱/车头/机头/步态起伏）与第三人称跟随视角。工具根据全路径长度自动匹配适用的漫游载具（2km内人物步行贴地、2km~100km车辆巡航贴地、100km以上飞机空中飞行）。',
    parameters: gisRoamSchema,
    handler: async ({ waypoints, vehicle, viewMode, targetSpeedKmh }) => {
      let path = normalizeWaypoints(waypoints)

      // 1. 若参数未提供足够点位，优先使用全局标记点列表
      if (path.length < GIS_ROAM_MIN_WAYPOINTS) {
        const storedMarkers = useGisStore.getState().markers
        if (storedMarkers.length >= GIS_ROAM_MIN_WAYPOINTS) {
          path = storedMarkers.map((m) => ({
            longitude: m.longitude,
            latitude: m.latitude,
            height: m.height,
            name: m.name
          }))
        }
      }

      // 2. 若仍不足，唤起生成式 UI 拾取面板
      if (path.length < GIS_ROAM_MIN_WAYPOINTS) {
        const collected = await useGisRoamStore.getState().beginCollection()
        path = collected ?? []
        if (path.length < GIS_ROAM_MIN_WAYPOINTS) {
          return {
            status: 'cancelled',
            message: '漫游已取消：用户取消了点位拾取或点位数量不足。'
          }
        }
      }

      // 3. 计算路径总长并推断载具
      const totalDistanceMeters = calculateTotalPathDistance(path)
      const selectedVehicle =
        vehicle && vehicle !== 'auto' ? vehicle : resolveVehicleByDistance(totalDistanceMeters)

      // 4. 启动漫游
      useGisRoamStore.getState().startRoam(path, {
        vehicleType: selectedVehicle,
        totalDistanceMeters,
        viewMode,
        targetSpeedKmh
      })

      const vehicleLabel =
        selectedVehicle === 'walk'
          ? '人物步行（贴地）'
          : selectedVehicle === 'vehicle'
            ? '车辆巡航（贴地）'
            : '客机飞行（空中飞行包线）'

      const currentMode = viewMode ?? useGisRoamStore.getState().viewMode
      const viewModeLabel = currentMode === 'first_person' ? '第一人称' : '第三人称'
      const speed = targetSpeedKmh ?? useGisRoamStore.getState().targetSpeedKmh

      return {
        status: 'success',
        message: `已开始三维漫游。视角：${viewModeLabel}，总航程：${formatDistance(totalDistanceMeters)}，航路点：${path.length} 个，匹配载具：${vehicleLabel}，目标时速：${speed} km/h（以真实物理加速度平滑起步）。`,
        totalDistance: totalDistanceMeters,
        vehicle: selectedVehicle,
        viewMode: currentMode,
        targetSpeedKmh: speed,
        waypointsCount: path.length
      }
    },
    render: ({ status, args }) => {
      const provided = normalizeWaypoints(args?.waypoints)
      const storedMarkers = useGisStore.getState().markers
      const hasEnough =
        provided.length >= GIS_ROAM_MIN_WAYPOINTS || storedMarkers.length >= GIS_ROAM_MIN_WAYPOINTS

      if (status === 'executing' && !hasEnough) {
        return <WaypointCollectPanel />
      }

      return emptyToolRender()
    }
  })
}
