import { create } from 'zustand'

export type GisToolType = 'none' | 'marker' | 'picker'

export type GisMarker = {
  id: string
  name: string
  longitude: number
  latitude: number
  height: number
  color?: string
  createdAt: number
}

export type GisDeployedCategory = 'tree' | 'building' | 'streetlight' | 'traffic_sign'

export type GisDeployedObject = {
  id: string
  name: string
  category: GisDeployedCategory
  longitude: number
  latitude: number
  height: number
  scale?: number
  modelUri?: string
  createdAt: number
}

type GisState = {
  activeTool: GisToolType
  markers: GisMarker[]
  deployedObjects: GisDeployedObject[]
  setActiveTool: (tool: GisToolType) => void
  addMarker: (marker: Omit<GisMarker, 'id' | 'createdAt'>) => GisMarker
  updateMarkerName: (id: string, name: string) => void
  removeMarker: (id: string) => void
  clearMarkers: () => void
  addDeployedObject: (object: Omit<GisDeployedObject, 'id' | 'createdAt'>) => GisDeployedObject
  removeDeployedObject: (id: string) => void
  clearDeployedObjects: () => void
}

export const useGisStore = create<GisState>((set) => ({
  activeTool: 'none',
  markers: [],
  deployedObjects: [],

  setActiveTool: (tool) => set({ activeTool: tool }),

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

  clearDeployedObjects: () => set({ deployedObjects: [] })
}))
