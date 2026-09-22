import { useCopilotChatConfiguration } from '@copilotkit/react-core/v2'
import { useNavigate } from '@tanstack/react-router'
import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@zen/ui'
import { Bot, SlidersHorizontal, X } from 'lucide-react'

/**
 * Agent 悬浮球右键简捷上下文菜单：
 * 提供快速开启/关闭 AI 助手会话窗口以及直达「宠物设置」专属设置页的快捷入口。
 * 形态、眼睛、表情等丰富定制已统一收敛至设置中心 (/settings/pet)。
 */
export function AgentPetContextMenu() {
  const configuration = useCopilotChatConfiguration()
  const navigate = useNavigate()
  const isOpen = configuration?.isModalOpen ?? false

  const handleToggleChat = () => {
    configuration?.setModalOpen(!isOpen)
  }

  const handleNavigateToSettings = () => {
    navigate({ to: '/settings/pet' })
  }

  return (
    <ContextMenuContent className="w-48">
      <ContextMenuItem onClick={handleToggleChat} className="cursor-pointer">
        {isOpen ? <X className="mr-2 size-4" /> : <Bot className="mr-2 size-4" />}
        <span>{isOpen ? '关闭 AI 助手' : '打开 AI 助手'}</span>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={handleNavigateToSettings} className="cursor-pointer">
        <SlidersHorizontal className="mr-2 size-4" />
        <span>宠物设置</span>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
