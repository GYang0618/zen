import { useLocation, useNavigate } from '@tanstack/react-router'
import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useSidebar
} from '@zen/ui'
import { Blocks, ClockFading, MessageCirclePlus, RotateCcwClock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { NavUser } from '@/components/layouts/components/nav-user'
import { ShellSidebarFrame } from '@/components/layouts/shell-sidebar-frame'
import { AGENT_PLUGIN_MARKET_PATH, isAgentPluginMarketPath, useSystemModeStore } from '@/stores'

import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { ChatHistory } from './chat-history'

import type { LucideIcon } from 'lucide-react'

/**
 * Agent 侧栏：外壳负责折叠与用户区，内容区新建对话钉在顶部，历史列表在剩余区域内滚动。
 * 图标栏下历史列表改由时钟按钮的 Popover 承载。
 */
export function AgentSidebar() {
  return (
    <ShellSidebarFrame scroll="self" footer={<NavUser />}>
      <AgentSidebarContent />
    </ShellSidebarFrame>
  )
}

function AgentSidebarContent() {
  const triggerNewThread = useAgentChatInputStore((state) => state.triggerNewThread)
  const setLastAgentPath = useSystemModeStore((state) => state.setLastAgentPath)
  const navigate = useNavigate()
  const { state, isMobile } = useSidebar()
  const isIconCollapsed = state === 'collapsed' && !isMobile

  const handleCreate = () => {
    triggerNewThread()
    setLastAgentPath('/chat')
    void navigate({ to: '/chat' })
  }

  return (
    <nav aria-label="对话" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="shrink-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <ThreadActions onCreate={handleCreate} />
      </div>

      {isIconCollapsed ? null : (
        <ScrollArea className="min-h-0 min-w-0 flex-1 pr-2.5">
          <ChatHistory />
        </ScrollArea>
      )}
    </nav>
  )
}

function ThreadActions({
  disabled = false,
  onCreate
}: {
  disabled?: boolean
  onCreate: () => void
}) {
  const { state, isMobile } = useSidebar()
  const isIconCollapsed = state === 'collapsed' && !isMobile

  return (
    <div className="flex flex-col gap-1">
      <SidebarActionButton
        label="发起新对话"
        icon={MessageCirclePlus}
        disabled={disabled}
        isIconCollapsed={isIconCollapsed}
        onClick={onCreate}
      />
      <SidebarActionButton
        label="自动化任务"
        icon={ClockFading}
        disabled={disabled}
        isIconCollapsed={isIconCollapsed}
      />
      <PluginMarketButton disabled={disabled} isIconCollapsed={isIconCollapsed} />

      {isIconCollapsed && <HistoryPopoverButton disabled={disabled} />}
    </div>
  )
}

function SidebarActionButton({
  label,
  icon: Icon,
  disabled,
  isIconCollapsed,
  active = false,
  onClick
}: {
  label: string
  icon: LucideIcon
  disabled?: boolean
  isIconCollapsed: boolean
  active?: boolean
  onClick?: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant={active ? 'secondary' : 'ghost'}
            size={isIconCollapsed ? 'icon' : 'default'}
            className={cn('h-8', isIconCollapsed ? 'size-8' : 'w-full justify-start')}
            disabled={disabled}
            onClick={onClick}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          />
        }
      >
        <Icon data-icon={!isIconCollapsed && 'inline-start'} />
        {!isIconCollapsed && <span>{label}</span>}
      </TooltipTrigger>
      <TooltipContent side="right" hidden={!isIconCollapsed}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

function PluginMarketButton({
  disabled,
  isIconCollapsed
}: {
  disabled?: boolean
  isIconCollapsed: boolean
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isActive = isAgentPluginMarketPath(pathname)

  const handleOpen = () => {
    if (isActive) return
    void navigate({ to: AGENT_PLUGIN_MARKET_PATH })
  }

  return (
    <SidebarActionButton
      label="插件"
      icon={Blocks}
      disabled={disabled}
      isIconCollapsed={isIconCollapsed}
      active={isActive}
      onClick={handleOpen}
    />
  )
}

function HistoryPopoverButton({ disabled }: { disabled?: boolean }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    if (pathnameRef.current === pathname) return
    pathnameRef.current = pathname
    setOpen(false)
  }, [pathname])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <PopoverTrigger
          disabled={disabled}
          render={
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={disabled}
                  aria-label="历史记录"
                />
              }
            />
          }
        >
          <RotateCcwClock />
        </PopoverTrigger>
        <TooltipContent side="right" hidden={open}>
          历史记录
        </TooltipContent>
      </Tooltip>
      <PopoverContent side="right" align="start" className="w-72 gap-2 p-2">
        <PopoverHeader className="px-2">
          <PopoverTitle>历史记录</PopoverTitle>
        </PopoverHeader>
        <ScrollArea className="pr-2.5">
          <div className="max-h-[min(20rem,calc(70dvh-3rem))]">
            <ChatHistory surface="popover" onThreadOpen={() => setOpen(false)} />
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
