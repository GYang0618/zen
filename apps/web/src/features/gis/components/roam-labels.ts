import { GIS_ACTION_CONFIG } from '../constants'

import type { GisRoamViewMode } from '../constants'
import type { GisFlightPhase, GisRoamAction, GisRoamVehicle } from '../stores/gis-roam'

export const ROAM_STATUS_LABEL: Record<GisRoamVehicle, string> = {
  walk: '步行漫游中',
  vehicle: '车辆巡航中',
  fighter: '歼-20 巡航中',
  plane: '飞机飞行中'
}

export const ROAM_COMMAND_TITLE: Record<GisRoamVehicle, string> = {
  walk: '行人实时指令',
  vehicle: '车辆驾驶指令',
  fighter: '歼-20 巡航指令',
  plane: '客机飞行指令'
}

export const ROAM_VIEW_MODE_LABEL: Record<GisRoamViewMode, string> = {
  first_person: '第一人称',
  third_person: '第三人称',
  free: '自由视角'
}

export const ROAM_FLIGHT_PHASE_LABEL: Record<GisFlightPhase, string> = {
  patrol: '空中巡检',
  taxi_start: '起飞滑跑',
  climb: '仰角爬升',
  cruise: '万米巡航',
  descent: '进近下滑',
  taxi_end: '着陆滑跑',
  stopped: '终点停机'
}

export const PLANE_ALTITUDE_STEPS_METERS = [200, 500, 1000] as const
export const PLANE_CLIMB_BOOST_KMH = 50
export const PLANE_DIVE_BOOST_KMH = 30
export const PLANE_TURN_STEPS_DEG = [15, 30, 45, 60] as const
export const PLANE_TURN_BOOST_KMH = 50
export const FIGHTER_ALTITUDE_STEPS_METERS = [300, 600, 1200] as const
export const FIGHTER_CLIMB_BOOST_KMH = 120
export const FIGHTER_DIVE_BOOST_KMH = 80
export const FIGHTER_BANK_STEPS_DEG = [30, 45, 60, 90] as const

export const WALK_PAUSE_SECONDS = GIS_ACTION_CONFIG.walk.pause.durationSec

export function roamActionLabel(action: GisRoamAction): string {
  switch (action.type) {
    case 'jump':
      return '跳跃中'
    case 'pause_briefly':
      return '驻留中'
    case 'lane_change_left':
      return '左变道超车'
    case 'lane_change_right':
      return '右变道超车'
    case 'airdrop':
      return '空投释放'
    case 'pitch_up':
      return '俯冲爬升'
    case 'pitch_down':
      return '进近下滑'
    case 'roll_axis':
      if (action.bankDeg < 0) return '左压坡度'
      if (action.bankDeg > 0) return '右压坡度'
      return '改平'
    case 'roll_turn':
      return '盘旋中'
  }
}
