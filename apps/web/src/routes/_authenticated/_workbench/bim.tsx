import { createFileRoute } from '@tanstack/react-router'
import { Cuboid } from 'lucide-react'

import { BIMScreen } from '@/features/bim'

export const Route = createFileRoute('/_authenticated/_workbench/bim')({
  component: BIMScreen,
  staticData: {
    title: '三维场景（BIM）',
    icon: Cuboid,
    order: 40
  }
})
