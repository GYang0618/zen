import { createFileRoute } from '@tanstack/react-router'

import { BIMScreen } from '@/features/bim'

export const Route = createFileRoute('/_authenticated/bim')({
  component: BIMScreen,
  staticData: {
    title: '三维场景（BIM）',
    icon: 'cuboid',
    group: '工作台',
    order: 40
  }
})
