import { createFileRoute } from '@tanstack/react-router'

import { CesiumScreen } from '@/features/gis'

export const Route = createFileRoute('/_authenticated/gis')({
  component: CesiumScreen,
  staticData: {
    title: '三维场景（GIS）',
    icon: 'globe',
    group: '工作台',
    order: 50
  }
})
