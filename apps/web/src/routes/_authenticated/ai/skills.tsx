import { ComingSoon } from '@/components/coming-soon'
import { createFileRoute } from '@tanstack/react-router'
import { Sparkle } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/ai/skills')({
  component: ComingSoon,
  staticData: {
    title: "技能市场",
    icon: Sparkle,
    order: 3,
  }
})


