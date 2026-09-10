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

function normalizeIds(id: string | null): {
  activeToolCallId: string | null
  activeSurfaceId: string | null
} {
  if (!id) return { activeToolCallId: null, activeSurfaceId: null }
  if (id.startsWith('a2ui-')) {
    return { activeToolCallId: id.slice(5), activeSurfaceId: id }
  }
  return { activeToolCallId: id, activeSurfaceId: `a2ui-${id}` }
}

export const useAgentGenerativePanelStore = create<AgentGenerativePanelState>((set) => ({
  isOpen: false,
  activeToolCallId: null,
  activeSurfaceId: null,
  setOpen: (isOpen) => set({ isOpen }),
  setActiveToolCallId: (id) => set(normalizeIds(id)),
  setActiveSurfaceId: (id) => set(normalizeIds(id)),
  openToolCall: (id) => set({ ...normalizeIds(id), isOpen: true }),
  openSurface: (id) => set({ ...normalizeIds(id), isOpen: true }),
  close: () => set({ isOpen: false })
}))
