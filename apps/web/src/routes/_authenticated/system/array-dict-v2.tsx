import { createFileRoute } from '@tanstack/react-router'
import { ListTree } from 'lucide-react'

import { ArrayDictV2Page } from '@/features/system/array-dict-v2'

export const Route = createFileRoute('/_authenticated/system/array-dict-v2')({
  component: ArrayDictV2Page,
  staticData: {
    title: '数组字典 V2',
    icon: ListTree,
    order: 45,
    permissions: ['system:dict:list']
  }
})
