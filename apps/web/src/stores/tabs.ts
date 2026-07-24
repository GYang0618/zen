import { create } from 'zustand'

export type TabItem = {
  id: string
  title: string
  path: string
  affix?: boolean
}

export interface TabsState {
  tabs: TabItem[]
  activeId: string | null
  addTab: (tab: TabItem) => void
  removeTab: (id: string) => void
  setActive: (id: string) => void
}

export const useTabsStore = create<TabsState>((set) => ({
  tabs: [],
  activeId: null,

  addTab: (tab) =>
    set((state) => {
      if (state.tabs.some((item) => item.id === tab.id)) {
        return { activeId: tab.id }
      }
      return {
        tabs: [...state.tabs, tab],
        activeId: tab.id
      }
    }),

  removeTab: (id) =>
    set((state) => {
      const target = state.tabs.find((item) => item.id === id)
      if (!target || target.affix) return state

      const tabs = state.tabs.filter((item) => item.id !== id)
      const activeId = state.activeId === id ? (tabs[tabs.length - 1]?.id ?? null) : state.activeId

      return { tabs, activeId }
    }),

  setActive: (id) => set({ activeId: id })
}))
