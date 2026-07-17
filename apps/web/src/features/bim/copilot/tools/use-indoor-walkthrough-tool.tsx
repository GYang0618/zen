import { useFrontendTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

import { useWalkthroughStore, WALKTHROUGH_MIN_WAYPOINTS } from '../../stores/walkthrough'
import { WaypointCollectPanel } from '../components/waypoint-collect-panel'

import type { WalkthroughPoint } from '../../stores/walkthrough'

const pointSchema = z.object({
  x: z.number().describe('点位 X（米）'),
  y: z.number().describe('点位 Y / 地面高度（米），漫游时相机会抬至视高'),
  z: z.number().describe('点位 Z（米）')
})

const indoorWalkthroughSchema = z.object({
  waypoints: z
    .array(pointSchema)
    .optional()
    .describe(
      `室内漫游路径点位（有序）。至少 ${WALKTHROUGH_MIN_WAYPOINTS} 个。若用户未提供或不完整，请省略此参数，前端会打开点位拾取面板。`
    )
})

function normalizeWaypoints(
  waypoints: z.infer<typeof indoorWalkthroughSchema>['waypoints']
): WalkthroughPoint[] {
  if (!waypoints) return []
  return waypoints.map((point) => ({
    x: point.x,
    y: point.y,
    z: point.z
  }))
}

function hasEnoughWaypoints(waypoints: WalkthroughPoint[]): boolean {
  return waypoints.length >= WALKTHROUGH_MIN_WAYPOINTS
}

export function useIndoorWalkthroughTool() {
  useFrontendTool({
    name: 'indoor_walkthrough',
    description:
      '启动室内漫游。可传入有序点位直接漫游；若用户未给出点位，省略 waypoints，由前端展示拾取面板，用户在场景中点击收集点位后自动开始漫游。',
    parameters: indoorWalkthroughSchema,
    handler: async ({ waypoints }) => {
      let path = normalizeWaypoints(waypoints)

      if (!hasEnoughWaypoints(path)) {
        path = (await useWalkthroughStore.getState().beginCollection()) ?? []
        if (!hasEnoughWaypoints(path)) {
          return {
            status: 'cancelled',
            message: '用户取消了点位拾取，或点位数量不足'
          }
        }
      }

      useWalkthroughStore.getState().startWalkthrough(path)
      return {
        status: 'success',
        message: `已开始室内漫游（${path.length} 个点位）`,
        waypoints: path
      }
    },
    render: ({ status, args }) => {
      const provided = normalizeWaypoints(args?.waypoints)
      const needsCollection = !hasEnoughWaypoints(provided)

      if (status === 'executing' && needsCollection) {
        return <WaypointCollectPanel />
      }

      if (status === 'executing' && !needsCollection) {
        return (
          <p className="text-muted-foreground rounded-md border bg-muted/30 px-3 py-2 text-sm">
            正在按 {provided.length} 个点位启动室内漫游…
          </p>
        )
      }

      if (status === 'complete') {
        return (
          <p className="text-muted-foreground rounded-md border bg-muted/30 px-3 py-2 text-sm">
            室内漫游已启动
          </p>
        )
      }

      return null
    }
  })
}
