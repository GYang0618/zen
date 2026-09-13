import { create } from 'zustand'

export const SHELL_MODES = ['agent', 'admin'] as const

export type ShellMode = (typeof SHELL_MODES)[number]

const STORAGE_KEY = 'zen.shell.mode'
const LAST_ADMIN_PATH_KEY = 'zen.shell.last-admin-path'
const LAST_AGENT_PATH_KEY = 'zen.shell.last-agent-path'
const DEFAULT_ADMIN_PATH = '/'
const DEFAULT_AGENT_PATH = '/chat'

/** Agent 全页聊天：`/chat` 与 `/chat/:threadId`，不含 `/chat-v2`。 */
export function isAgentChatPath(pathname: string): boolean {
  return pathname === '/chat' || pathname.startsWith('/chat/')
}

/** 从智能体路由路径中解析 threadId，如 `/chat/thread-123` => `'thread-123'` */
export function parseThreadIdFromPath(pathname: string): string | undefined {
  if (!isAgentChatPath(pathname)) return undefined
  const match = pathname.match(/^\/chat\/([^/?#]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : undefined
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

function readLastAgentPath(): string {
  if (typeof window === 'undefined') return DEFAULT_AGENT_PATH
  const raw = localStorage.getItem(LAST_AGENT_PATH_KEY)
  return raw && isAgentChatPath(raw) ? raw : DEFAULT_AGENT_PATH
}

export interface ShellModeState {
  mode: ShellMode
  lastAdminPath: string
  lastAgentPath: string
  setMode: (mode: ShellMode) => void
  setLastAdminPath: (path: string) => void
  setLastAgentPath: (path: string) => void
}

export const useShellModeStore = create<ShellModeState>((set) => ({
  mode: readMode(),
  lastAdminPath: readLastAdminPath(),
  lastAgentPath: readLastAgentPath(),

  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode)
    set({ mode })
  },

  setLastAdminPath: (path) => {
    if (!path || isAgentChatPath(path)) return
    localStorage.setItem(LAST_ADMIN_PATH_KEY, path)
    set((state) => (state.lastAdminPath === path ? state : { lastAdminPath: path }))
  },

  setLastAgentPath: (path) => {
    if (!path || !isAgentChatPath(path)) return
    localStorage.setItem(LAST_AGENT_PATH_KEY, path)
    set((state) => (state.lastAgentPath === path ? state : { lastAgentPath: path }))
  }
}))
