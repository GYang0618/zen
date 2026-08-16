import { createFileRoute } from '@tanstack/react-router'
import { BriefcaseBusiness } from 'lucide-react'

import { Posts } from '@/features/system/posts'

export const Route = createFileRoute('/_authenticated/system/_identity/posts')({
  component: Posts,
  staticData: {
    title: '岗位管理',
    description: '维护可跨组织复用的岗位目录标准',
    icon: BriefcaseBusiness,
    order: 25,
    permissions: ['system:post:list']
  }
})
