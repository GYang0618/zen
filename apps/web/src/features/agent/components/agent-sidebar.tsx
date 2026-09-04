import {
  Button,
  cn,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useSidebar
} from '@zen/ui'
import { ClockFading, Pencil } from 'lucide-react'

import { useAgentChatShellStore } from '../stores/agent-chat-shell'
import { ChatHistory } from './chat-history'

/**
 * Agent 侧栏内容：新建对话钉在顶部，历史列表在剩余区域内滚动。
 * 由布局壳放入 `SidebarContent`；图标栏下仅保留新建按钮。
 */
export function AgentSidebar() {
  const createThread = useAgentChatShellStore((state) => state.handlers?.createThread)

  return (
    <nav aria-label="对话" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="shrink-0  group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <NewThreadButton disabled={!createThread} onCreate={() => void createThread?.()} />
      </div>

      <ScrollArea className="pr-2.5 min-h-0 min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <ChatHistory />
      </ScrollArea>
    </nav>
  )
}

function NewThreadButton({
  disabled = false,
  onCreate
}: {
  disabled?: boolean
  onCreate: () => void
}) {
  const { state, isMobile } = useSidebar()
  const isIconCollapsed = state === 'collapsed' && !isMobile

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={isIconCollapsed ? 'icon' : 'default'}
            className={cn(
              'h-8 rounded-full',
              isIconCollapsed ? 'size-8' : 'w-full  justify-start '
            )}
            disabled={disabled}
            onClick={onCreate}
            aria-label="发起新对话"
          >
            <Pencil data-icon={!isIconCollapsed && 'inline-start'} />
            {!isIconCollapsed && <span>发起新对话</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" hidden={!isIconCollapsed}>
          发起新对话
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={isIconCollapsed ? 'icon' : 'default'}
            className={cn(
              'h-8 rounded-full',
              isIconCollapsed ? 'size-8' : 'w-full  justify-start '
            )}
            disabled={disabled}
            aria-label="自动化任务"
          >
            <ClockFading data-icon={!isIconCollapsed && 'inline-start'} />
            {!isIconCollapsed && <span>自动化任务</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" hidden={!isIconCollapsed}>
          自动化任务
        </TooltipContent>
      </Tooltip>
    </>
  )
}
