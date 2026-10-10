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
import { ClockFading, MessageCirclePlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useShellModeStore } from '@/stores'

import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { ChatHistory } from './chat-history'

const HISTORY_LABEL = '历史记录'

/**
 * Agent 侧栏内容：新建对话钉在顶部，历史列表在剩余区域内滚动。
 * 图标栏下历史列表改由时钟按钮的 Popover 承载。
 */
export function AgentSidebar() {
  const triggerNewThread = useAgentChatInputStore((state) => state.triggerNewThread)
  const setLastAgentPath = useShellModeStore((state) => state.setLastAgentPath)
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
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size={isIconCollapsed ? 'icon' : 'default'}
              className={cn('h-8', isIconCollapsed ? 'size-8' : 'w-full justify-start')}
              disabled={disabled}
              onClick={onCreate}
              aria-label="发起新对话"
            />
          }
        >
          <MessageCirclePlus data-icon={!isIconCollapsed && 'inline-start'} />
          {!isIconCollapsed && <span>发起新对话</span>}
        </TooltipTrigger>
        <TooltipContent side="right" hidden={!isIconCollapsed}>
          发起新对话
        </TooltipContent>
      </Tooltip>

      {isIconCollapsed ? (
        <HistoryPopoverButton disabled={disabled} />
      ) : (
        <AutomationTaskButton disabled={disabled} />
      )}
    </div>
  )
}

function AutomationTaskButton({ disabled }: { disabled?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="default"
            className="h-8 w-full justify-start"
            disabled={disabled}
            aria-label="自动化任务"
          />
        }
      >
        <ClockFading data-icon="inline-start" />
        <span>自动化任务</span>
      </TooltipTrigger>
      <TooltipContent side="right" hidden>
        自动化任务
      </TooltipContent>
    </Tooltip>
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
                  aria-label={HISTORY_LABEL}
                />
              }
            />
          }
        >
          <ClockFading />
        </PopoverTrigger>
        <TooltipContent side="right" hidden={open}>
          {HISTORY_LABEL}
        </TooltipContent>
      </Tooltip>
      <PopoverContent side="right" align="start" className="w-72 gap-2 p-2">
        <PopoverHeader className="px-2">
          <PopoverTitle>{HISTORY_LABEL}</PopoverTitle>
        </PopoverHeader>
        <ScrollArea className="h-[min(20rem,calc(70dvh-3rem))] pr-2.5">
          <ChatHistory surface="popover" onThreadOpen={() => setOpen(false)} />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
