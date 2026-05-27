import { create } from 'zustand'

export type BimModelInstance = {
  id: string
  url: string
  position: [number, number, number]
}

type BimState = {
  modelInstances: BimModelInstance[]
  addModelInstance: (instance: { url: string; position: [number, number, number] }) => string
}

export const useBimStore = create<BimState>((set) => ({
  modelInstances: [],

  addModelInstance: ({ url, position }) => {
    const id = crypto.randomUUID()
    set((state) => ({
      modelInstances: [...state.modelInstances, { id, url, position }]
    }))
    return id
  }
}))
