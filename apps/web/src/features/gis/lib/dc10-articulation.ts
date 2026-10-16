import { Cartesian3, Matrix3, Matrix4, Quaternion } from 'cesium'

import { GIS_ROAM_CONFIG } from '../constants'
import {
  DC10_FAN_NODES,
  DC10_GEAR_DURATION_SECONDS,
  DC10_GEAR_TRACKS,
  DC10_WHEEL_NODES
} from './dc10-gear-tracks'

import type { GisFlightPhase } from '../stores/gis-roam'

export interface Dc10TrackKey {
  t: number
  v: number[]
}

export interface Dc10GearNodeTracks {
  rest: {
    translation: number[]
    rotation: number[]
    scale: number[]
  }
  translation?: Dc10TrackKey[]
  rotation?: Dc10TrackKey[]
  scale?: Dc10TrackKey[]
}

export type Dc10GearTracks = Record<string, Dc10GearNodeTracks>

export interface Dc10FanRest {
  name: string
  translation: number[]
  rotation: number[]
}

interface NodePose {
  translation: Cartesian3
  rotation: Quaternion
  scale: Cartesian3
}

const WHEEL_AXLE = new Cartesian3(0, 1, 0)
const FAN_AXIS = new Cartesian3(0, 0, 1)
const scratchRoll = new Quaternion()
const scratchMatrix3 = new Matrix3()
const scratchRest = new Matrix4()
const scratchAnim = new Matrix4()
const scratchDelta = new Matrix4()
const scratchTranslation = new Cartesian3()
const scratchRotation = new Quaternion()
const scratchScale = new Cartesian3()

function sampleTrack(keys: Dc10TrackKey[], time: number, result: number[]) {
  if (time <= keys[0].t) {
    result.splice(0, result.length, ...keys[0].v)
    return
  }
  const last = keys[keys.length - 1]
  if (time >= last.t) {
    result.splice(0, result.length, ...last.v)
    return
  }
  let upper = 1
  while (keys[upper].t < time) upper += 1
  const previous = keys[upper - 1]
  const next = keys[upper]
  const span = next.t - previous.t
  const alpha = span > 0 ? (time - previous.t) / span : 0
  for (let index = 0; index < previous.v.length; index += 1) {
    result[index] = previous.v[index] + (next.v[index] - previous.v[index]) * alpha
  }
}

function writeVector(target: Cartesian3, values: number[]) {
  target.x = values[0] ?? 0
  target.y = values[1] ?? 0
  target.z = values[2] ?? 1
}

function writeQuaternion(target: Quaternion, values: number[]) {
  target.x = values[0] ?? 0
  target.y = values[1] ?? 0
  target.z = values[2] ?? 0
  target.w = values[3] ?? 1
}

function gearTarget(phase: GisFlightPhase): number {
  if (phase === 'climb' || phase === 'cruise') return 0
  return 1
}

/**
 * 客机起落架、轮子和三台风扇。
 * 起落架沿模型动画从放下插到收起。轮子在滑行时绕局部 Y 转。风扇绕局部 Z 转。
 */
export function createDc10Articulation() {
  const sampled = [0, 0, 0, 1]
  const nodes: Record<string, NodePose> = {}
  const inverseRest = new Map<string, Matrix4>()

  for (const [name, tracks] of Object.entries(DC10_GEAR_TRACKS)) {
    nodes[name] = {
      translation: new Cartesian3(),
      rotation: new Quaternion(),
      scale: new Cartesian3(1, 1, 1)
    }
    Matrix4.fromTranslationQuaternionRotationScale(
      Cartesian3.fromArray(tracks.rest.translation),
      Quaternion.unpack(tracks.rest.rotation),
      Cartesian3.fromArray(tracks.rest.scale),
      scratchRest
    )
    inverseRest.set(name, Matrix4.inverse(scratchRest, new Matrix4()))
  }
  for (const name of DC10_WHEEL_NODES) {
    if (nodes[name]) continue
    nodes[name] = {
      translation: new Cartesian3(),
      rotation: new Quaternion(),
      scale: new Cartesian3(1, 1, 1)
    }
    inverseRest.set(name, Matrix4.clone(Matrix4.IDENTITY))
  }
  for (const fan of DC10_FAN_NODES) {
    nodes[fan.name] = {
      translation: new Cartesian3(),
      rotation: new Quaternion(),
      scale: new Cartesian3(1, 1, 1)
    }
  }

  let gearExtension = 1
  let wheelAngle = 0
  let fanAngle = 0

  function writeDelta(name: string, translation: Cartesian3, rotation: Quaternion, scale: Cartesian3) {
    const pose = nodes[name]
    const restInverse = inverseRest.get(name)
    if (!pose || !restInverse) return
    Matrix4.fromTranslationQuaternionRotationScale(translation, rotation, scale, scratchAnim)
    Matrix4.multiply(restInverse, scratchAnim, scratchDelta)
    Matrix4.getTranslation(scratchDelta, pose.translation)
    Matrix4.getRotation(scratchDelta, scratchMatrix3)
    Quaternion.fromRotationMatrix(scratchMatrix3, pose.rotation)
    Matrix4.getScale(scratchDelta, pose.scale)
  }

  function applyGear(time: number, roll: Quaternion | undefined) {
    for (const [name, tracks] of Object.entries(DC10_GEAR_TRACKS)) {
      Cartesian3.clone(Cartesian3.fromArray(tracks.rest.translation, 0, scratchTranslation), scratchTranslation)
      Quaternion.clone(Quaternion.unpack(tracks.rest.rotation, 0, scratchRotation), scratchRotation)
      Cartesian3.clone(Cartesian3.fromArray(tracks.rest.scale, 0, scratchScale), scratchScale)
      if (tracks.translation) {
        sampleTrack(tracks.translation, time, sampled)
        writeVector(scratchTranslation, sampled)
      }
      if (tracks.scale) {
        sampleTrack(tracks.scale, time, sampled)
        writeVector(scratchScale, sampled)
      }
      if (tracks.rotation) {
        sampleTrack(tracks.rotation, time, sampled)
        writeQuaternion(scratchRotation, sampled)
      }
      if (roll && (DC10_WHEEL_NODES as readonly string[]).includes(name)) {
        Quaternion.multiply(scratchRotation, roll, scratchRotation)
      }
      writeDelta(name, scratchTranslation, scratchRotation, scratchScale)
    }
    if (!roll) return
    for (const name of DC10_WHEEL_NODES) {
      if (DC10_GEAR_TRACKS[name]) continue
      writeDelta(name, Cartesian3.ZERO, roll, Cartesian3.ONE)
    }
  }

  function applyFans() {
    Quaternion.fromAxisAngle(FAN_AXIS, fanAngle, scratchRotation)
    for (const fan of DC10_FAN_NODES) {
      const pose = nodes[fan.name]
      pose.translation.x = 0
      pose.translation.y = 0
      pose.translation.z = 0
      pose.scale.x = 1
      pose.scale.y = 1
      pose.scale.z = 1
      Quaternion.clone(scratchRotation, pose.rotation)
    }
  }

  applyGear(0, undefined)
  applyFans()

  return {
    nodes,
    update(phase: GisFlightPhase, dt: number, speedMps: number, moving: boolean) {
      const { gearRetractSeconds, wheelRadiusMeters, fanRadiansPerSecond } = GIS_ROAM_CONFIG.plane
      const target = gearTarget(phase)
      const step = dt / gearRetractSeconds
      if (gearExtension < target) gearExtension = Math.min(target, gearExtension + step)
      else if (gearExtension > target) gearExtension = Math.max(target, gearExtension - step)

      const rolling = moving && (phase === 'taxi_start' || phase === 'taxi_end') && gearExtension > 0.85
      if (rolling) wheelAngle += (speedMps * dt) / wheelRadiusMeters
      if (dt > 0) {
        const cruise = GIS_ROAM_CONFIG.plane.speedMps
        const thrust = Math.max(0.35, speedMps / cruise)
        fanAngle += fanRadiansPerSecond * thrust * dt
      }

      Quaternion.fromAxisAngle(WHEEL_AXLE, wheelAngle, scratchRoll)
      applyGear((1 - gearExtension) * DC10_GEAR_DURATION_SECONDS, wheelAngle === 0 ? undefined : scratchRoll)
      applyFans()
    }
  }
}
