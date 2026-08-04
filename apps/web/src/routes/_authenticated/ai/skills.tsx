import { createFileRoute } from '@tanstack/react-router'
import { Sparkle } from 'lucide-react'

import { SkillsFeaturePage } from '@/features/skills'

export const Route = createFileRoute('/_authenticated/ai/skills')({
  component: SkillsFeaturePage,
  staticData: {
    title: '技能市场',
    description: '为智能体安装可复用的专业能力。',
    icon: Sparkle,
    order: 3
  }
})
