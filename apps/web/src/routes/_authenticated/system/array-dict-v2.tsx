import { createFileRoute } from '@tanstack/react-router'
import { ListTree } from 'lucide-react'

import { ArrayDictV2Page } from '@/features/system/array-dict-v2'

export const Route = createFileRoute('/_authenticated/system/array-dict-v2')({
  component: ArrayDictV2Page,
  staticData: {
    title: '数组字典 V2',
    description: '独立的前端字典工作台，变更仅保留在当前会话。',
    icon: ListTree,
    order: 45,
    permissions: ['system:dict:list']
  }
})
