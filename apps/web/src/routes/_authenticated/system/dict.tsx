import { createFileRoute } from '@tanstack/react-router'

import { DictPage } from '@/features/system/dict'

export const Route = createFileRoute('/_authenticated/system/dict')({
  component: DictPage,
  staticData: {
    title: '数据字典',
    icon: 'book',
    group: '系统管理',
    order: 40,
    permissions: ['system:dict:list']
  }
})
