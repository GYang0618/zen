import { createFileRoute } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'

import { DictPage } from '@/features/system/dict'

export const Route = createFileRoute('/_authenticated/system/dict')({
  component: DictPage,
  staticData: {
    title: '数据字典',
    icon: BookOpen,
    order: 40,
    permissions: ['system:dict:list']
  }
})
