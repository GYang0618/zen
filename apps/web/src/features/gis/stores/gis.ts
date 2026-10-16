import { create } from 'zustand'

import type { GisSceneModelId } from '../constants'
import type { GlbBounds } from '../lib/glb-bounds'

export type GisToolType = 'none' | 'marker' | 'picker' | 'select'

/** 场景拾取到的对象。id 是交给助手的唯一身份。 */
export type GisPickedKind = 'deployed-model' | 'entity' | 'tile-feature' | 'primitive'

export type GisPickedTarget = {
  id: string
  kind: GisPickedKind
  name: string
  modelId?: string
  longitude?: number
  latitude?: number
  height?: number
}

/** 坐标定位完成后的短暂闪烁标记，到期由定位标记层移除 */
export type GisLocateFlash = {
  id: string
  longitude: number
  latitude: number
  height: number
}

export type GisMarker = {
  id: string
  name: string
  longitude: number
  latitude: number
  height: number
  color?: string
  createdAt: number
}

/** 部署当时根据 GLB 和场景算出的加载参数，供瓦片重建使用 */
export type GisDeployedObject = {
  id: string
  name: string
  modelId: GisSceneModelId
  modelUri: string
  longitude: number
  latitude: number
  height: number
  heading: number
  scale: number
  cellId: string
  geometricError: number
  loadDistanceMeters: number
  groundOffset: number
  diameterMeters: number
  radiusMeters: number
  bounds: GlbBounds
  createdAt: number
}

type GisState = {
  activeTool: GisToolType
  markers: GisMarker[]
  deployedObjects: GisDeployedObject[]
  locateFlash: GisLocateFlash | null
  pickedTargets: GisPickedTarget[]
  setActiveTool: (tool: GisToolType) => void
  showLocateFlash: (point: Omit<GisLocateFlash, 'id'>) => void
  clearLocateFlash: () => void
  addMarker: (marker: Omit<GisMarker, 'id' | 'createdAt'>) => GisMarker
  updateMarkerName: (id: string, name: string) => void
  removeMarker: (id: string) => void
  clearMarkers: () => void
  addDeployedObject: (object: Omit<GisDeployedObject, 'id' | 'createdAt'>) => GisDeployedObject
  removeDeployedObject: (id: string) => void
  clearDeployedObjects: () => void
  replacePickedTargets: (targets: GisPickedTarget[]) => void
  addPickedTargets: (targets: GisPickedTarget[]) => void
  togglePickedTarget: (target: GisPickedTarget) => void
  removePickedTarget: (id: string) => void
  clearPickedTargets: () => void
}

export const useGisStore = create<GisState>((set) => ({
  activeTool: 'none',
  markers: [],
  deployedObjects: [],
  locateFlash: null,
  pickedTargets: [],

  setActiveTool: (tool) => set({ activeTool: tool }),

  showLocateFlash: (point) =>
    set({
      locateFlash: {
        ...point,
        id: `gis_locate_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      }
    }),

  clearLocateFlash: () => set({ locateFlash: null }),

  addMarker: (marker) => {
    const newMarker: GisMarker = {
      ...marker,
      id: `gis_marker_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now()
    }
    set((state) => ({
      markers: [...state.markers, newMarker]
    }))
    return newMarker
  },

  updateMarkerName: (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set((state) => ({
      markers: state.markers.map((marker) =>
        marker.id === id ? { ...marker, name: trimmed } : marker
      )
    }))
  },

  removeMarker: (id) =>
    set((state) => ({
      markers: state.markers.filter((m) => m.id !== id)
    })),

  clearMarkers: () => set({ markers: [] }),

  addDeployedObject: (object) => {
    const newObject: GisDeployedObject = {
      ...object,
      id: `gis_object_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now()
    }
    set((state) => ({
      deployedObjects: [...state.deployedObjects, newObject]
    }))
    return newObject
  },

  removeDeployedObject: (id) =>
    set((state) => ({
      deployedObjects: state.deployedObjects.filter((o) => o.id !== id)
    })),

  clearDeployedObjects: () => set({ deployedObjects: [] }),

  replacePickedTargets: (targets) => set({ pickedTargets: uniquePickedTargets(targets) }),

  addPickedTargets: (targets) =>
    set((state) => ({
      pickedTargets: uniquePickedTargets([...state.pickedTargets, ...targets])
    })),

  togglePickedTarget: (target) =>
    set((state) => ({
      pickedTargets: state.pickedTargets.some((item) => item.id === target.id)
        ? state.pickedTargets.filter((item) => item.id !== target.id)
        : [...state.pickedTargets, target]
    })),

  removePickedTarget: (id) =>
    set((state) => ({
      pickedTargets: state.pickedTargets.filter((item) => item.id !== id)
    })),

  clearPickedTargets: () => set({ pickedTargets: [] })
}))

function uniquePickedTargets(targets: GisPickedTarget[]): GisPickedTarget[] {
  const byId = new Map<string, GisPickedTarget>()
  for (const target of targets) {
    byId.set(target.id, target)
  }
  return [...byId.values()]
}
