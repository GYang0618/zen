import { createFileRoute } from '@tanstack/react-router'
import { Globe } from 'lucide-react'
import { lazy, Suspense } from 'react'

import { RoutePending } from '@/components/route-pending'

const CesiumScreen = lazy(() =>
  import('@/features/gis').then((module) => ({ default: module.CesiumScreen }))
)

export const Route = createFileRoute('/_authenticated/_workbench/gis')({
  pendingComponent: RoutePending,
  component: function GisRoute() {
    return (
      <Suspense fallback={<RoutePending />}>
        <CesiumScreen />
      </Suspense>
    )
  },
  staticData: {
    title: '三维场景（GIS）',
    icon: Globe,
    order: 50
  }
})
