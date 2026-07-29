import { createFileRoute } from '@tanstack/react-router'
import { Sparkle } from 'lucide-react'

import { SkillsFeaturePage } from '@/features/skills'

export const Route = createFileRoute('/_authenticated/ai/skills')({
  component: SkillsFeaturePage,
  staticData: {
    title: '技能市场',
    icon: Sparkle,
    order: 3
  }
})
