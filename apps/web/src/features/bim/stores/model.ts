import { create } from 'zustand'

import { MAX_BIM_SELECTION } from '../constants'

export type BimModelInstance = {
  id: string
  url: string
  position?: [number, number, number]
}

type SelectOptions = {
  /** Shift 多选：切换当前 id，保留其余选中 */
  multi?: boolean
  /** 追加到当前选中（不取消已有） */
  append?: boolean
}

type BimState = {
  modelInstances: BimModelInstance[]
  selectedElementIds: string[]
  addModelInstance: (instance: { url: string; position: [number, number, number] }) => string
  selectElement: (id: string, options?: SelectOptions) => void
  setSelection: (ids: string[]) => void
  clearSelection: () => void
}

function clampSelection(ids: string[]): string[] {
  return ids.slice(0, MAX_BIM_SELECTION)
}

export const useModelStore = create<BimState>((set, get) => ({
  modelInstances: [],
  selectedElementIds: [],

  addModelInstance: ({ url, position }) => {
    const id = crypto.randomUUID()
    set((state) => ({
      modelInstances: [...state.modelInstances, { id, url, position }]
    }))
    return id
  },

  selectElement: (id, options = {}) => {
    const { multi = false, append = false } = options
    const current = get().selectedElementIds

    if (multi) {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      set({ selectedElementIds: clampSelection([...next]) })
      return
    }

    if (append) {
      if (current.includes(id)) return
      set({ selectedElementIds: clampSelection([...current, id]) })
      return
    }

    set({ selectedElementIds: [id] })
  },

  setSelection: (ids) => {
    set({ selectedElementIds: clampSelection([...new Set(ids)]) })
  },

  clearSelection: () => {
    set({ selectedElementIds: [] })
  }
}))
