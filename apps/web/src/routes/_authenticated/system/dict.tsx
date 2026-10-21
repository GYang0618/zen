import { createFileRoute } from '@tanstack/react-router'
import { LibraryBig } from 'lucide-react'

import { Dict } from '@/features/system/dict'

export const Route = createFileRoute('/_authenticated/system/dict')({
  component: Dict,
  staticData: {
    title: '数据字典',
    description: '按空间组织系统与业务枚举项，统一维护全局选项与状态。',
    icon: LibraryBig,
    order: 40,
    permissions: ['system:dict:list']
  }
})
