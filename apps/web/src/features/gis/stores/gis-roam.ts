import { create } from 'zustand'

import { GIS_ROAM_MIN_WAYPOINTS } from '../constants'

import type { GisRoamViewMode } from '../constants'

export type GisWaypoint = {
  longitude: number
  latitude: number
  height?: number
  name?: string
}

export type GisRoamVehicle = 'walk' | 'vehicle' | 'plane'

export type GisRoamPhase = 'idle' | 'collecting' | 'picking' | 'roaming' | 'paused'

export const GIS_ROAM_SPEED_LEVELS = [0.25, 0.5, 1, 2, 4, 8, 16] as const

type GisRoamState = {
  phase: GisRoamPhase
  waypoints: GisWaypoint[]
  vehicleType: GisRoamVehicle
  viewMode: GisRoamViewMode
  totalDistanceMeters: number
  speedMultiplier: number
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
    }
  ) => void
  pauseRoam: () => void
  resumeRoam: () => void
  restartRoam: () => void
  stopRoam: () => void
  setViewMode: (viewMode: GisRoamViewMode) => void
  toggleViewMode: () => void
  setSpeedMultiplier: (multiplier: number) => void
  speedUp: () => void
  speedDown: () => void
  resetSpeed: () => void
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
  totalDistanceMeters: 0,
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
    set({
      resolveCollection: null,
      waypoints,
      vehicleType: options?.vehicleType ?? 'walk',
      viewMode: options?.viewMode ?? get().viewMode,
      totalDistanceMeters: options?.totalDistanceMeters ?? 0,
      phase: 'roaming'
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
    const { phase } = get()
    if (phase === 'roaming' || phase === 'paused') {
      set((state) => ({
        phase: 'roaming',
        roamProgress: 0,
        restartCount: state.restartCount + 1
      }))
    }
  },

  stopRoam: () => {
    if (get().phase === 'roaming' || get().phase === 'paused') {
      set({
        phase: 'idle',
        speedMultiplier: 1,
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

  setSpeedMultiplier: (multiplier) => {
    set({ speedMultiplier: Math.max(0.25, Math.min(32, multiplier)) })
  },

  speedUp: () => {
    const current = get().speedMultiplier
    const next = GIS_ROAM_SPEED_LEVELS.find((lvl) => lvl > current) ?? current * 2
    set({ speedMultiplier: Math.min(32, next) })
  },

  speedDown: () => {
    const current = get().speedMultiplier
    const reversed = [...GIS_ROAM_SPEED_LEVELS].reverse()
    const prev = reversed.find((lvl) => lvl < current) ?? current / 2
    set({ speedMultiplier: Math.max(0.25, prev) })
  },

  resetSpeed: () => {
    set({ speedMultiplier: 1 })
  },

  updateRoamProgress: (remainingRealSeconds, roamProgress) => {
    set({ remainingRealSeconds, roamProgress })
  }
}))
