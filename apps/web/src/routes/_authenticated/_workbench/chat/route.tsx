import { createFileRoute } from '@tanstack/react-router'
import { MessageCircleMore } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/_workbench/chat')({
  component: () => null,
  staticData: {
    title: 'AI聊天',
    icon: MessageCircleMore,
    order: 30,
    hideInMenu: true
  }
})
