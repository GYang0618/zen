import { create } from 'zustand'

export interface AgentGenerativePanelState {
  isOpen: boolean
  activeToolCallId: string | null
  activeSurfaceId: string | null
  setOpen: (open: boolean) => void
  setActiveToolCallId: (id: string | null) => void
  setActiveSurfaceId: (id: string | null) => void
  openToolCall: (id: string) => void
  openSurface: (id: string) => void
  close: () => void
}

export const useAgentGenerativePanelStore = create<AgentGenerativePanelState>((set) => ({
  isOpen: false,
  activeToolCallId: null,
  activeSurfaceId: null,
  setOpen: (isOpen) => set({ isOpen }),
  setActiveToolCallId: (id) => set({ activeToolCallId: id }),
  setActiveSurfaceId: (id) => set({ activeSurfaceId: id }),
  openToolCall: (id) => set({ activeToolCallId: id, isOpen: true }),
  openSurface: (id) => set({ activeSurfaceId: id, isOpen: true }),
  close: () => set({ isOpen: false })
}))
