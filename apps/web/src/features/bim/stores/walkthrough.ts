import { create } from 'zustand'

export type WalkthroughPoint = {
  x: number
  y: number
  z: number
}

export type WalkthroughPhase = 'idle' | 'collecting' | 'picking' | 'walking'

const MIN_WAYPOINTS = 2

type WalkthroughState = {
  phase: WalkthroughPhase
  waypoints: WalkthroughPoint[]
  resolveCollection: ((result: WalkthroughPoint[] | null) => void) | null
  beginCollection: () => Promise<WalkthroughPoint[] | null>
  startPicking: () => void
  addWaypoint: (point: WalkthroughPoint) => void
  removeWaypoint: (index: number) => void
  completePicking: () => void
  cancelCollection: () => void
  startWalkthrough: (waypoints: WalkthroughPoint[]) => void
  finishWalkthrough: () => void
  stopWalkthrough: () => void
}

function isCollectingPhase(phase: WalkthroughPhase): boolean {
  return phase === 'collecting' || phase === 'picking'
}

export const useWalkthroughStore = create<WalkthroughState>((set, get) => ({
  phase: 'idle',
  waypoints: [],
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
    if (waypoints.length < MIN_WAYPOINTS) return

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

  startWalkthrough: (waypoints) => {
    if (waypoints.length < MIN_WAYPOINTS) return
    get().resolveCollection?.(null)
    set({
      resolveCollection: null,
      waypoints,
      phase: 'walking'
    })
  },

  finishWalkthrough: () => {
    if (get().phase !== 'walking') return
    set({ phase: 'idle' })
  },

  stopWalkthrough: () => {
    if (get().phase !== 'walking') return
    set({ phase: 'idle' })
  }
}))

export const WALKTHROUGH_MIN_WAYPOINTS = MIN_WAYPOINTS
