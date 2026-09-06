import { createFileRoute } from '@tanstack/react-router'
import { Cuboid } from 'lucide-react'
import { lazy, Suspense } from 'react'

import { RoutePending } from '@/components/route-pending'

const BIMScreen = lazy(() =>
  import('@/features/bim').then((module) => ({ default: module.BIMScreen }))
)

export const Route = createFileRoute('/_authenticated/_workbench/bim')({
  pendingComponent: RoutePending,
  component: function BimRoute() {
    return (
      <Suspense fallback={<RoutePending />}>
        <BIMScreen />
      </Suspense>
    )
  },
  staticData: {
    title: '三维场景（BIM）',
    icon: Cuboid,
    order: 40
  }
})
