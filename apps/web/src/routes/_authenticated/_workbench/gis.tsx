import { createFileRoute } from '@tanstack/react-router'
import { Globe } from 'lucide-react'

import { CesiumScreen } from '@/features/gis'

export const Route = createFileRoute('/_authenticated/_workbench/gis')({
  component: CesiumScreen,
  staticData: {
    title: 'GIS场景',
    icon: Globe,
    order: 50
  }
})
