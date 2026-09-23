import { create } from 'zustand'

import { GIS_ROAM_CONFIG, GIS_ROAM_MIN_WAYPOINTS, GIS_ROAM_SPEED_MULTIPLIERS } from '../constants'

import type { GisRoamViewMode } from '../constants'

export type GisWaypoint = {
  longitude: number
  latitude: number
  height?: number
  name?: string
}

export type GisRoamVehicle = 'walk' | 'vehicle' | 'plane'

export type GisRoamPhase = 'idle' | 'collecting' | 'picking' | 'roaming' | 'paused'

export type GisFlightPhase = 'taxi_start' | 'climb' | 'cruise' | 'descent' | 'taxi_end' | 'stopped'

export type GisRoamAction =
  | { type: 'jump' }
  | { type: 'pause_briefly'; durationSeconds?: number }
  | { type: 'lane_change_left'; speedBoostKmh?: number }
  | { type: 'lane_change_right'; speedBoostKmh?: number }
  | { type: 'airdrop' }
  | { type: 'pitch_up'; deltaAltitude?: number; speedBoostKmh?: number; durationSec?: number }
  | { type: 'pitch_down'; deltaAltitude?: number; speedBoostKmh?: number; durationSec?: number }
  | {
      type: 'roll_turn'
      deltaHeadingDeg: number
      bankRollDeg?: number
      speedBoostKmh?: number
      durationSec?: number
    }

export type GisRoamViewTarget = 'vehicle' | 'airdrop'

export type GisAirdropInfo = {
  isDescending: boolean
  altitudeMeters: number
  groundHeight: number
  etaSeconds: number
}

type GisRoamState = {
  phase: GisRoamPhase
  waypoints: GisWaypoint[]
  vehicleType: GisRoamVehicle
  viewMode: GisRoamViewMode
  /** 当前相机观察主体：主载具还是空投物资箱 */
  viewTarget: GisRoamViewTarget
  /** 当前活跃空投箱状态信息 */
  airdropInfo: GisAirdropInfo | null
  totalDistanceMeters: number
  /** 实时物理瞬时时速 (km/h)，从 0 开始平滑起步 */
  currentSpeedKmh: number
  /** 用户或 AI 设定的目标时速 (km/h) */
  targetSpeedKmh: number
  /** 临时航向偏转角 (度)，支持方向转向控制 */
  headingOffsetDeg: number
  /** 横向变道平移位移 (米) */
  lateralOffsetMeters: number
  /** 垂向位移 (米，如跳跃、爬升) */
  verticalOffsetMeters: number
  /** 当前正在执行的特定动作指令 */
  activeAction: GisRoamAction | null
  /** 飞机当前飞行生命周期阶段 */
  flightPhase?: GisFlightPhase
  remainingRealSeconds: number | null
  roamProgress: number
  restartCount: number
  resolveCollection: ((result: GisWaypoint[] | null) => void) | null

  beginCollection: () => Promise<GisWaypoint[] | null>
  startPicking: () => void
  addWaypoint: (point: GisWaypoint) => void
  removeWaypoint: (index: number) => void
  completePicking: () => void
  cancelCollection: () => void
  startRoam: (
    waypoints: GisWaypoint[],
    options?: {
      vehicleType?: GisRoamVehicle
      totalDistanceMeters?: number
      viewMode?: GisRoamViewMode
      targetSpeedKmh?: number
    }
  ) => void
  pauseRoam: () => void
  resumeRoam: () => void
  restartRoam: () => void
  stopRoam: () => void
  setViewMode: (viewMode: GisRoamViewMode) => void
  toggleViewMode: () => void
  setViewTarget: (target: GisRoamViewTarget) => void
  setAirdropInfo: (info: GisAirdropInfo | null) => void
  setTargetSpeedKmh: (speedKmh: number) => void
  speedUp: () => void
  speedDown: () => void
  resetSpeed: () => void
  turnDirection: (deltaDeg: number) => void
  resetDirection: () => void
  triggerAction: (action: GisRoamAction) => void
  clearAction: () => void
  updatePhysicsState: (params: {
    currentSpeedKmh: number
    remainingRealSeconds: number
    roamProgress: number
    flightPhase?: GisFlightPhase
  }) => void
  /** 漫游播放物理倍速（0.5x, 1x, 2x, 4x, 8x, 16x） */
  speedMultiplier: number
  setSpeedMultiplier: (multiplier: number) => void
  cycleSpeedMultiplier: () => void
  updateRoamProgress: (remainingRealSeconds: number, roamProgress: number) => void
}

function isCollectingPhase(phase: GisRoamPhase): boolean {
  return phase === 'collecting' || phase === 'picking'
}

export const useGisRoamStore = create<GisRoamState>((set, get) => ({
  phase: 'idle',
  waypoints: [],
  vehicleType: 'walk',
  viewMode: 'first_person',
  viewTarget: 'vehicle',
  airdropInfo: null,
  totalDistanceMeters: 0,
  currentSpeedKmh: 0,
  targetSpeedKmh: GIS_ROAM_CONFIG.walk.cruiseSpeedKmh,
  headingOffsetDeg: 0,
  lateralOffsetMeters: 0,
  verticalOffsetMeters: 0,
  activeAction: null,
  flightPhase: undefined,
  speedMultiplier: 1,
  remainingRealSeconds: null,
  roamProgress: 0,
  restartCount: 0,
  resolveCollection: null,

  beginCollection: () =>
    new Promise((resolve) => {
      const prev = get().resolveCollection
      prev?.(null)
      set({
        phase: 'collecting',
        waypoints: [],
        resolveCollection: resolve
      })
    }),

  startPicking: () => {
    if (!isCollectingPhase(get().phase)) return
    set({ phase: 'picking' })
  },

  addWaypoint: (point) => {
    if (get().phase !== 'picking') return
    set((state) => ({
      waypoints: [...state.waypoints, point]
    }))
  },

  removeWaypoint: (index) => {
    if (!isCollectingPhase(get().phase)) return
    set((state) => ({
      waypoints: state.waypoints.filter((_, i) => i !== index)
    }))
  },

  completePicking: () => {
    const { waypoints, resolveCollection, phase } = get()
    if (!isCollectingPhase(phase)) return
    if (waypoints.length < GIS_ROAM_MIN_WAYPOINTS) return

    resolveCollection?.(waypoints)
    set({
      resolveCollection: null,
      phase: 'idle'
    })
  },

  cancelCollection: () => {
    const { resolveCollection, phase } = get()
    if (!isCollectingPhase(phase)) return

    resolveCollection?.(null)
    set({
      resolveCollection: null,
      waypoints: [],
      phase: 'idle'
    })
  },

  startRoam: (waypoints, options) => {
    if (waypoints.length < GIS_ROAM_MIN_WAYPOINTS) return
    get().resolveCollection?.(null)
    const selectedVehicle = options?.vehicleType ?? 'walk'
    const config = GIS_ROAM_CONFIG[selectedVehicle]
    set({
      resolveCollection: null,
      waypoints,
      vehicleType: selectedVehicle,
      viewMode: options?.viewMode ?? get().viewMode,
      viewTarget: 'vehicle',
      airdropInfo: null,
      totalDistanceMeters: options?.totalDistanceMeters ?? 0,
      currentSpeedKmh: 0, // 统一从 0 km/h 真实起步加速
      targetSpeedKmh: options?.targetSpeedKmh ?? config.cruiseSpeedKmh,
      headingOffsetDeg: 0,
      lateralOffsetMeters: 0,
      verticalOffsetMeters: 0,
      activeAction: null,
      flightPhase: selectedVehicle === 'plane' ? 'taxi_start' : undefined,
      phase: 'roaming',
      roamProgress: 0
    })
  },

  pauseRoam: () => {
    if (get().phase === 'roaming') {
      set({ phase: 'paused' })
    }
  },

  resumeRoam: () => {
    if (get().phase === 'paused') {
      set({ phase: 'roaming' })
    }
  },

  restartRoam: () => {
    const { phase, vehicleType, waypoints } = get()
    if (
      phase === 'roaming' ||
      phase === 'paused' ||
      (phase === 'idle' && waypoints.length >= GIS_ROAM_MIN_WAYPOINTS)
    ) {
      const config = GIS_ROAM_CONFIG[vehicleType]
      set((state) => ({
        phase: 'roaming',
        roamProgress: 0,
        currentSpeedKmh: 0,
        targetSpeedKmh: config.cruiseSpeedKmh,
        viewTarget: 'vehicle',
        airdropInfo: null,
        headingOffsetDeg: 0,
        lateralOffsetMeters: 0,
        verticalOffsetMeters: 0,
        activeAction: null,
        flightPhase: vehicleType === 'plane' ? 'taxi_start' : undefined,
        remainingRealSeconds: null,
        restartCount: state.restartCount + 1
      }))
    }
  },

  stopRoam: () => {
    if (get().phase === 'roaming' || get().phase === 'paused') {
      set({
        phase: 'idle',
        currentSpeedKmh: 0,
        speedMultiplier: 1,
        viewTarget: 'vehicle',
        airdropInfo: null,
        headingOffsetDeg: 0,
        lateralOffsetMeters: 0,
        verticalOffsetMeters: 0,
        activeAction: null,
        flightPhase: undefined,
        remainingRealSeconds: null,
        roamProgress: 0,
        restartCount: 0
      })
    }
  },

  setViewMode: (viewMode) => {
    set({ viewMode })
  },

  toggleViewMode: () => {
    set((state) => {
      let nextMode: GisRoamViewMode = 'first_person'
      if (state.viewMode === 'first_person') {
        nextMode = 'third_person'
      } else if (state.viewMode === 'third_person') {
        nextMode = 'free'
      } else {
        nextMode = 'first_person'
      }
      return { viewMode: nextMode }
    })
  },

  setViewTarget: (viewTarget) => {
    set({ viewTarget })
  },

  setAirdropInfo: (airdropInfo) => {
    set({ airdropInfo })
  },

  setTargetSpeedKmh: (speedKmh) => {
    const config = GIS_ROAM_CONFIG[get().vehicleType]
    const clamped = Math.max(config.minSpeedKmh, Math.min(config.maxSpeedKmh, speedKmh))
    set({ targetSpeedKmh: clamped })
  },

  speedUp: () => {
    const { targetSpeedKmh, vehicleType } = get()
    const config = GIS_ROAM_CONFIG[vehicleType]
    const nextSpeed = Math.min(config.maxSpeedKmh, targetSpeedKmh + config.speedStepKmh)
    set({ targetSpeedKmh: nextSpeed })
  },

  speedDown: () => {
    const { targetSpeedKmh, vehicleType } = get()
    const config = GIS_ROAM_CONFIG[vehicleType]
    const prevSpeed = Math.max(config.minSpeedKmh, targetSpeedKmh - config.speedStepKmh)
    set({ targetSpeedKmh: prevSpeed })
  },

  resetSpeed: () => {
    const config = GIS_ROAM_CONFIG[get().vehicleType]
    set({ targetSpeedKmh: config.cruiseSpeedKmh })
  },

  turnDirection: (deltaDeg) => {
    set((state) => ({ headingOffsetDeg: state.headingOffsetDeg + deltaDeg }))
  },

  resetDirection: () => {
    set({ headingOffsetDeg: 0 })
  },

  triggerAction: (action) => {
    set({ activeAction: action })
  },

  clearAction: () => {
    set({ activeAction: null })
  },

  updatePhysicsState: ({ currentSpeedKmh, remainingRealSeconds, roamProgress, flightPhase }) => {
    set({
      currentSpeedKmh,
      remainingRealSeconds,
      roamProgress,
      flightPhase
    })
  },

  setSpeedMultiplier: (multiplier) => {
    const validMultiplier = Math.max(0.1, Math.min(32, multiplier))
    set({ speedMultiplier: validMultiplier })
  },

  cycleSpeedMultiplier: () => {
    const presets = GIS_ROAM_SPEED_MULTIPLIERS
    const current = get().speedMultiplier
    const currentIndex = presets.indexOf(current as (typeof presets)[number])
    const nextIndex = currentIndex === -1 ? 1 : (currentIndex + 1) % presets.length
    set({ speedMultiplier: presets[nextIndex] })
  },

  updateRoamProgress: (remainingRealSeconds, roamProgress) => {
    set({ remainingRealSeconds, roamProgress })
  }
}))
