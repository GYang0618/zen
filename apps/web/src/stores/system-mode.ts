import { create } from 'zustand'

export const SHELL_MODES = ['agent', 'admin'] as const

export type ShellMode = (typeof SHELL_MODES)[number]

const STORAGE_KEY = 'zen.shell.mode'
const LAST_ADMIN_PATH_KEY = 'zen.shell.last-admin-path'
const LAST_AGENT_PATH_KEY = 'zen.shell.last-agent-path'
const DEFAULT_ADMIN_PATH = '/'
const DEFAULT_AGENT_PATH = '/chat'

/** 智能体侧栏内打开的插件页，不进入管理后台。 */
export const AGENT_PLUGIN_MARKET_PATH = '/ai/plugins' as const

/** Agent 全页聊天：`/chat` 与 `/chat/:threadId`，不含 `/chat-v2`。 */
export function isAgentChatPath(pathname: string): boolean {
  return pathname === '/chat' || pathname.startsWith('/chat/')
}

/** 插件页属于智能体内容区，而不是管理后台菜单页。 */
export function isAgentPluginMarketPath(pathname: string): boolean {
  return pathname === AGENT_PLUGIN_MARKET_PATH
}

function isAgentShellPath(pathname: string): boolean {
  return isAgentChatPath(pathname) || isAgentPluginMarketPath(pathname)
}

type RouteModeMatch = {
  staticData: {
    mode?: ShellMode
  }
}

/**
 * 从当前匹配链解析工作模式。叶子优先，缺省为管理后台。
 * 直接访问和跨模式跳转都以此为准，不再按具体路径分支。
 */
export function resolveRouteMode(matches: readonly RouteModeMatch[]): ShellMode {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const mode = matches[index]?.staticData.mode
    if (mode === 'agent' || mode === 'admin') return mode
  }
  return 'admin'
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

/** 管理后台回跳地址。插件页和对话页不属于后台，读到时回退到默认页。 */
export function resolveAdminPath(path: string | undefined): string {
  if (!path || isAgentShellPath(path)) return DEFAULT_ADMIN_PATH
  return path
}

function readLastAdminPath(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PATH
  const raw = localStorage.getItem(LAST_ADMIN_PATH_KEY) || DEFAULT_ADMIN_PATH
  const resolved = resolveAdminPath(raw)
  if (resolved !== raw) localStorage.setItem(LAST_ADMIN_PATH_KEY, resolved)
  return resolved
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

export const useSystemModeStore = create<ShellModeState>((set) => ({
  mode: readMode(),
  lastAdminPath: readLastAdminPath(),
  lastAgentPath: readLastAgentPath(),

  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode)
    set({ mode })
  },

  setLastAdminPath: (path) => {
    if (!path || isAgentShellPath(path)) return
    localStorage.setItem(LAST_ADMIN_PATH_KEY, path)
    set((state) => (state.lastAdminPath === path ? state : { lastAdminPath: path }))
  },

  setLastAgentPath: (path) => {
    if (!path || !isAgentChatPath(path)) return
    localStorage.setItem(LAST_AGENT_PATH_KEY, path)
    set((state) => (state.lastAgentPath === path ? state : { lastAgentPath: path }))
  }
}))
