import { create } from 'zustand'

import { MAX_TILESET_SELECTION } from '../constants'

type SelectOptions = {
  multi?: boolean
  append?: boolean
}

type TilesetSelectionState = {
  selectedElementIds: string[]
  selectElement: (id: string, options?: SelectOptions) => void
  setSelection: (ids: string[]) => void
  clearSelection: () => void
}

function clampSelection(ids: string[]): string[] {
  return ids.slice(0, MAX_TILESET_SELECTION)
}

export const useTilesetSelectionStore = create<TilesetSelectionState>((set, get) => ({
  selectedElementIds: [],

  selectElement: (id, options = {}) => {
    const { multi = false, append = false } = options
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

    set({ selectedElementIds: nextIds })
  },

  setSelection: (ids) => {
    set({ selectedElementIds: clampSelection([...new Set(ids)]) })
  },

  clearSelection: () => {
    set({ selectedElementIds: [] })
  }
}))
