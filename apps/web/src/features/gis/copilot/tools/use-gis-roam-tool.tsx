import { useFrontendTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

import { emptyToolRender } from '@/components/ai/empty-tool-render'

import { formatRoamVehiclePurposeGuide, GIS_ROAM_MIN_WAYPOINTS } from '../../constants'
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
      `有序漫游航路点列表（至少 ${GIS_ROAM_MIN_WAYPOINTS} 个）。仅在用户明确要求漫游时传入。单点定位不要传这个参数，应改用 gis_locate。若用户未提供航路点，请省略此参数。`
    ),
  vehicle: z
    .enum(['auto', 'walk', 'vehicle', 'plane', 'fighter'])
    .optional()
    .describe(
      `漫游载具。用户点了模型名，或只说了用途、没点名时，按用途传入对应值，不要传 auto。用途对照：${formatRoamVehiclePurposeGuide()}。驾驶默认是汽车，除非同时在说飞机、客机、战机、巡检或巡逻。两者都没有时才传 auto 或省略，再按距离选：<=2km 步行、2km~100km 汽车、>100km 客机。歼-20 不会因距离被自动选中。`
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
      '指定目标巡航时速（km/h）。若省略自动使用该载具的标准巡航时速（步行 5 km/h，车辆 60 km/h，客机 800 km/h，歼-20 巡检 900 km/h）。漫游统一从 0 km/h 起步平滑加速至该目标速度'
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
    description: `沿至少两个航路点启动三维漫游。仅当用户明确要求漫游、巡航、沿路径前往时调用。用户只说定位、飞到、跳转、看一下或前往某一个地点时，禁止调用本工具，必须改用 gis_locate。不要为了定位编造第二个航路点。没点名载具时按用途选 vehicle，不要交给 auto：${formatRoamVehiclePurposeGuide()}。`,
    parameters: gisRoamSchema,
    handler: async ({ waypoints, vehicle, viewMode, targetSpeedKmh }) => {
      const provided = normalizeWaypoints(waypoints)

      if (provided.length > 0 && provided.length < GIS_ROAM_MIN_WAYPOINTS) {
        return {
          status: 'error',
          message: `只收到 ${provided.length} 个点，不能启动漫游。单点定位请改用 gis_locate，不要把定位请求当成漫游。`
        }
      }

      let path = provided

      // 未传航路点时，才使用场景里已有的标记点
      if (path.length === 0) {
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
            : selectedVehicle === 'fighter'
              ? '歼-20 空中巡检（1500 米平飞）'
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
      if (provided.length > 0 && provided.length < GIS_ROAM_MIN_WAYPOINTS) {
        return emptyToolRender()
      }

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
