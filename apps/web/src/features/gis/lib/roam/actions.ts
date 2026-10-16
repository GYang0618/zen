import { GIS_ACTION_CONFIG } from '../../constants'
import { kmhToMps } from './units'

import type { GisRoamAction } from '../../stores/gis-roam'

const MIN_ROLL_TURN_SEC = 3
const PITCH_REFERENCE_ALTITUDE_METERS = 500
const MIN_ACTION_PITCH_DEG = 8
const PLANE_PITCH_CAP_DEG = 25
const FIGHTER_PITCH_CAP_DEG = 40

export interface RoamActionRuntime {
  action: GisRoamAction
  elapsedSec: number
  startSpeedBoost?: number
  startBankDeg?: number
}

export interface RoamActionFrame {
  lateralOffsetM: number
  verticalOffsetM: number
  pitchDeg: number
  yawDeg: number
  targetMps: number
  heldBankDeg: number
  done: boolean
}

const frame: RoamActionFrame = {
  lateralOffsetM: 0,
  verticalOffsetM: 0,
  pitchDeg: 0,
  yawDeg: 0,
  targetMps: 0,
  heldBankDeg: 0,
  done: false
}

export function openRoamAction(action: GisRoamAction, heldBankDeg: number): RoamActionRuntime {
  const runtime: RoamActionRuntime = {
    action,
    elapsedSec: 0,
    startBankDeg: heldBankDeg
  }
  if (action.type === 'lane_change_left' || action.type === 'lane_change_right') {
    const boostKmh =
      action.speedBoostKmh ?? GIS_ACTION_CONFIG.vehicle.laneChange.overtakeSpeedBoostKmh
    runtime.startSpeedBoost = kmhToMps(boostKmh)
  }
  return runtime
}

/** 推进当前动作一帧。返回的对象在下次调用前有效，不要留到下一帧。 */
export function stepRoamAction(
  runtime: RoamActionRuntime,
  dt: number,
  targetMps: number,
  heldBankDeg: number,
  isFighter: boolean
): RoamActionFrame {
  runtime.elapsedSec += dt
  frame.lateralOffsetM = 0
  frame.verticalOffsetM = 0
  frame.pitchDeg = 0
  frame.yawDeg = 0
  frame.targetMps = targetMps
  frame.heldBankDeg = heldBankDeg
  frame.done = false

  switch (runtime.action.type) {
    case 'jump':
      stepJump(runtime.elapsedSec)
      break
    case 'pause_briefly':
      stepPause(runtime)
      break
    case 'lane_change_left':
    case 'lane_change_right':
      stepLaneChange(runtime)
      break
    case 'pitch_up':
    case 'pitch_down':
      stepPitch(runtime, isFighter)
      break
    case 'roll_turn':
      stepRollTurn(runtime)
      break
    case 'roll_axis':
      stepRollAxis(runtime)
      break
    case 'airdrop':
      frame.done = true
      break
  }
  return frame
}

function stepJump(elapsedSec: number) {
  const duration = GIS_ACTION_CONFIG.walk.jump.durationSec
  if (elapsedSec > duration) {
    frame.done = true
    return
  }
  const normT = elapsedSec / duration
  const { maxHeightMeters } = GIS_ACTION_CONFIG.walk.jump
  frame.verticalOffsetM = 4 * maxHeightMeters * normT * (1 - normT)
}

function stepPause(runtime: RoamActionRuntime) {
  if (runtime.action.type !== 'pause_briefly') return
  const pauseDuration = runtime.action.durationSeconds ?? GIS_ACTION_CONFIG.walk.pause.durationSec
  frame.targetMps = 0
  frame.done = runtime.elapsedSec >= pauseDuration
}

function stepLaneChange(runtime: RoamActionRuntime) {
  const action = runtime.action
  if (action.type !== 'lane_change_left' && action.type !== 'lane_change_right') return

  const sign = action.type === 'lane_change_left' ? -1 : 1
  const cfg = GIS_ACTION_CONFIG.vehicle.laneChange
  const totalDuration = cfg.shiftDurationSec * 2 + cfg.holdDurationSec
  const maxLat = cfg.lateralOffsetMeters
  const elapsed = runtime.elapsedSec

  if (elapsed <= cfg.shiftDurationSec) {
    const progress = elapsed / cfg.shiftDurationSec
    frame.lateralOffsetM = sign * maxLat * smoothStep(progress)
    return
  }

  const holdEnd = cfg.shiftDurationSec + cfg.holdDurationSec
  if (elapsed <= holdEnd) {
    frame.lateralOffsetM = sign * maxLat
    frame.targetMps += runtime.startSpeedBoost ?? 0
    return
  }

  if (elapsed <= totalDuration) {
    const progress = (elapsed - holdEnd) / cfg.shiftDurationSec
    frame.lateralOffsetM = sign * maxLat * (1 - smoothStep(progress))
    return
  }

  frame.done = true
}

function stepPitch(runtime: RoamActionRuntime, isFighter: boolean) {
  const action = runtime.action
  if (action.type !== 'pitch_up' && action.type !== 'pitch_down') return

  const sign = action.type === 'pitch_up' ? 1 : -1
  const cfg = isFighter ? GIS_ACTION_CONFIG.fighter.diveClimb : GIS_ACTION_CONFIG.plane.diveClimb
  const pitchCap = isFighter ? FIGHTER_PITCH_CAP_DEG : PLANE_PITCH_CAP_DEG
  const duration = action.durationSec ?? cfg.durationSec
  const deltaH = action.deltaAltitude ?? cfg.deltaAltitudeMeters
  const boostKmh = action.speedBoostKmh ?? 0

  if (runtime.elapsedSec > duration) {
    frame.done = true
    return
  }

  const envelope = Math.sin((runtime.elapsedSec / duration) * Math.PI)
  frame.verticalOffsetM = sign * deltaH * envelope
  const maxPitch = Math.min(
    pitchCap,
    Math.max(MIN_ACTION_PITCH_DEG, (deltaH / PITCH_REFERENCE_ALTITUDE_METERS) * cfg.pitchAngleDeg)
  )
  frame.pitchDeg = sign * maxPitch * envelope
  if (boostKmh > 0) frame.targetMps += kmhToMps(boostKmh) * envelope
}

function stepRollTurn(runtime: RoamActionRuntime) {
  if (runtime.action.type !== 'roll_turn') return

  const cfg = GIS_ACTION_CONFIG.plane.rollTurn
  const deltaHeading = runtime.action.deltaHeadingDeg
  const duration =
    runtime.action.durationSec ??
    Math.max(MIN_ROLL_TURN_SEC, (Math.abs(deltaHeading) / cfg.deltaHeadingDeg) * cfg.durationSec)
  const boostKmh = runtime.action.speedBoostKmh ?? 0

  if (runtime.elapsedSec > duration) {
    frame.done = true
    return
  }

  const envelope = Math.sin((runtime.elapsedSec / duration) * Math.PI)
  frame.yawDeg = deltaHeading * envelope
  if (boostKmh > 0) frame.targetMps += kmhToMps(boostKmh) * envelope
}

function stepRollAxis(runtime: RoamActionRuntime) {
  if (runtime.action.type !== 'roll_axis') return

  const cfg = GIS_ACTION_CONFIG.fighter.rollAxis
  const duration = runtime.action.durationSec ?? cfg.durationSec
  const startBank = runtime.startBankDeg ?? 0
  const targetBank = Math.max(-cfg.maxBankDeg, Math.min(cfg.maxBankDeg, runtime.action.bankDeg))

  if (runtime.elapsedSec > duration) {
    frame.heldBankDeg = targetBank
    frame.done = true
    return
  }

  const progress = runtime.elapsedSec / duration
  frame.heldBankDeg = startBank + (targetBank - startBank) * smoothStep(progress)
}

function smoothStep(progress: number): number {
  return progress * progress * (3 - 2 * progress)
}
