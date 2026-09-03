import { create } from 'zustand'

export const SHELL_MODES = ['agent', 'admin'] as const

export type ShellMode = (typeof SHELL_MODES)[number]

const STORAGE_KEY = 'zen.shell.mode'
const LAST_ADMIN_PATH_KEY = 'zen.shell.last-admin-path'
const DEFAULT_ADMIN_PATH = '/'

/** Agent 全页聊天：`/chat` 与 `/chat/:threadId`，不含 `/chat-v2`。 */
export function isAgentChatPath(pathname: string): boolean {
  return pathname === '/chat' || pathname.startsWith('/chat/')
}

function readMode(): ShellMode {
  if (typeof window === 'undefined') return 'admin'
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === 'agent' || raw === 'admin' ? raw : 'admin'
}

function readLastAdminPath(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PATH
  return localStorage.getItem(LAST_ADMIN_PATH_KEY) || DEFAULT_ADMIN_PATH
}

export interface ShellModeState {
  mode: ShellMode
  lastAdminPath: string
  setMode: (mode: ShellMode) => void
  setLastAdminPath: (path: string) => void
}

export const useShellModeStore = create<ShellModeState>((set) => ({
  mode: readMode(),
  lastAdminPath: readLastAdminPath(),

  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode)
    set({ mode })
  },

  setLastAdminPath: (path) => {
    if (!path || isAgentChatPath(path)) return
    localStorage.setItem(LAST_ADMIN_PATH_KEY, path)
    set({ lastAdminPath: path })
  }
}))
