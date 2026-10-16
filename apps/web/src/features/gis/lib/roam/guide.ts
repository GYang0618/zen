import { Cartesian3 } from 'cesium'

import type { GisFlightPhase } from '../../stores/gis-roam'
import type {
  createFlightTrajectory,
  createGroundTrajectory,
  FlightPathSample,
  GroundPathSample
} from '../geo-utils'

export type FlightTrajectory = NonNullable<ReturnType<typeof createFlightTrajectory>>
export type GroundTrajectory = NonNullable<ReturnType<typeof createGroundTrajectory>>

export interface RoamGuide {
  flightPhase: GisFlightPhase
  pitchDeg: number
  targetKmh: number
}

const scratchFlight: FlightPathSample = {
  position: new Cartesian3(),
  forwardDir: new Cartesian3(),
  altitudeMeters: 0,
  pitchDeg: 0,
  phase: 'taxi_start',
  targetSpeedKmh: 0
}

const scratchGround: GroundPathSample = {
  position: new Cartesian3(),
  forwardDir: new Cartesian3()
}

const guide: RoamGuide = {
  flightPhase: 'cruise',
  pitchDeg: 0,
  targetKmh: 0
}

/** 把轨迹起点写入 result，供模型在第一帧之前就停在航线起点。 */
export function copyTrajectoryOrigin(
  isAir: boolean,
  flightTraj: FlightTrajectory | null,
  groundTraj: GroundTrajectory | null,
  result: Cartesian3
) {
  if (isAir && flightTraj) {
    Cartesian3.clone(flightTraj.sampleAtDistance(0, scratchFlight).position, result)
    return
  }
  if (groundTraj) {
    Cartesian3.clone(groundTraj.sampleAtDistance(0, scratchGround).position, result)
  }
}

/** 按当前弧长取航向、俯仰和包线目标时速。位置在积分之后另采样。 */
export function sampleRoamGuide(input: {
  isAir: boolean
  flightTraj: FlightTrajectory | null
  groundTraj: GroundTrajectory | null
  distanceTraveled: number
  flightPhase: GisFlightPhase
  targetKmh: number
  forwardDir: Cartesian3
}): RoamGuide {
  guide.flightPhase = input.flightPhase
  guide.pitchDeg = 0
  guide.targetKmh = input.targetKmh

  if (input.isAir && input.flightTraj) {
    const sample = input.flightTraj.sampleAtDistance(input.distanceTraveled, scratchFlight)
    guide.flightPhase = sample.phase
    guide.pitchDeg = sample.pitchDeg
    Cartesian3.clone(sample.forwardDir, input.forwardDir)
    if (sample.phase === 'taxi_start') {
      guide.targetKmh = Math.max(sample.targetSpeedKmh, input.targetKmh)
    } else if (sample.phase === 'taxi_end') {
      guide.targetKmh = sample.targetSpeedKmh
    }
    return guide
  }

  if (input.groundTraj) {
    const sample = input.groundTraj.sampleAtDistance(input.distanceTraveled, scratchGround)
    Cartesian3.clone(sample.forwardDir, input.forwardDir)
  }
  return guide
}
