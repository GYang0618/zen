import { createFileRoute } from '@tanstack/react-router'
import { GitBranch } from 'lucide-react'

import { ComingSoon } from '@/components/coming-soon'

export const Route = createFileRoute('/_authenticated/ai/workflows')({
  component: ComingSoon,
  staticData: {
    title: '自动化与流程',
    icon: GitBranch,
    order: 2
  }
})
