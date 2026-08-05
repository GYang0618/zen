import { createFileRoute } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'

import { DictPage } from '@/features/system/dict'

export const Route = createFileRoute('/_authenticated/system/dict')({
  component: DictPage,
  staticData: {
    title: '数据字典',
    description: '维护字典类型与字典项，供业务下拉与枚举复用',
    icon: BookOpen,
    order: 40,
    permissions: ['system:dict:list']
  }
})
