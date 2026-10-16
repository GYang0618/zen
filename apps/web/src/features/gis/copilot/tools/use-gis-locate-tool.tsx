import { useFrontendTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

import { emptyToolRender } from '@/components/ai/empty-tool-render'

import { useCesium } from '../../cesium-provider'
import { formatCoordinates } from '../../lib/geo-utils'
import { locateCameraTo } from '../../lib/locate-camera'

const gisLocateSchema = z.object({
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe('目标经度（WGS84 十进制度）。地名需先换算成经纬度再传入'),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .describe('目标纬度（WGS84 十进制度）。地名需先换算成经纬度再传入'),
  height: z.number().optional().describe('目标高程（米）。省略时贴地采样，不要为了定位去编造高程'),
  name: z.string().optional().describe('地点名称，仅用于回复，例如“上海”')
})

export function useGisLocateTool() {
  const { viewer } = useCesium()

  useFrontendTool({
    name: 'gis_locate',
    description:
      '把相机飞到一个地点并短暂闪烁标记，不启动漫游、不沿路径移动。用户说定位、飞到、跳转、看一下、前往某一个地点或坐标时，只能调用本工具。禁止同时调用 gis_roam，禁止为了定位编造第二个航路点。',
    parameters: gisLocateSchema,
    handler: async ({ longitude, latitude, height, name }) => {
      const resolved = await locateCameraTo(viewer, { longitude, latitude, height })
      if (!resolved) {
        return {
          status: 'cancelled',
          message: '定位被新的相机飞行打断，没有开始漫游。'
        }
      }

      const label = name?.trim() || '目标点'
      return {
        status: 'success',
        message: `已定位到${label}（${formatCoordinates(resolved.longitude, resolved.latitude, resolved.height)}）。这是相机定位，不是漫游，不要再调用 gis_roam。`,
        longitude: resolved.longitude,
        latitude: resolved.latitude,
        height: resolved.height
      }
    },
    render: () => emptyToolRender()
  })
}
