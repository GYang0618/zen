import { create } from 'zustand'

import { MAX_TILESET_SELECTION } from '../constants'
import { tilesetFeatureRegistry } from '../lib/feature-registry'

type SelectOptions = {
  multi?: boolean
  append?: boolean
  properties?: Record<string, unknown>
}

type InspectionState = {
  inspectedElementId: string | null
  inspectedProperties: Record<string, unknown> | undefined
}

type TilesetSelectionState = {
  selectedElementIds: string[]
  inspectedElementId: string | null
  inspectedProperties: Record<string, unknown> | undefined
  selectElement: (id: string, options?: SelectOptions) => void
  setSelection: (ids: string[]) => void
  clearSelection: () => void
}

function resolveInspection(
  id: string,
  nextIds: string[],
  properties?: Record<string, unknown>
): InspectionState {
  if (nextIds.includes(id)) {
    return {
      inspectedElementId: id,
      inspectedProperties: properties ?? tilesetFeatureRegistry.getElementProperties(id)
    }
  }

  const fallbackId = nextIds.at(-1) ?? null
  if (!fallbackId) {
    return { inspectedElementId: null, inspectedProperties: undefined }
  }

  return {
    inspectedElementId: fallbackId,
    inspectedProperties: tilesetFeatureRegistry.getElementProperties(fallbackId)
  }
}

function clampSelection(ids: string[]): string[] {
  return ids.slice(0, MAX_TILESET_SELECTION)
}

export const useTilesetSelectionStore = create<TilesetSelectionState>((set, get) => ({
  selectedElementIds: [],
  inspectedElementId: null,
  inspectedProperties: undefined,

  selectElement: (id, options = {}) => {
    const { multi = false, append = false, properties } = options
    const current = get().selectedElementIds
    let nextIds: string[]

    if (multi) {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      nextIds = clampSelection([...next])
    } else if (append) {
      if (current.includes(id)) return
      nextIds = clampSelection([...current, id])
    } else {
      nextIds = [id]
    }

    set({
      selectedElementIds: nextIds,
      ...resolveInspection(id, nextIds, properties)
    })
  },

  setSelection: (ids) => {
    const nextIds = clampSelection([...new Set(ids)])
    const lastId = nextIds.at(-1) ?? null
    set({
      selectedElementIds: nextIds,
      inspectedElementId: lastId,
      inspectedProperties: lastId
        ? tilesetFeatureRegistry.getElementProperties(lastId)
        : undefined
    })
  },

  clearSelection: () => {
    set({
      selectedElementIds: [],
      inspectedElementId: null,
      inspectedProperties: undefined
    })
  }
}))
