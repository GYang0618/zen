import { createFileRoute } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'

import { BIMScreen } from '@/features/bim'

export const Route = createFileRoute('/_authenticated/_workbench/bim')({
  component: BIMScreen,
  staticData: {
    title: 'BIM场景',
    icon: Building2,
    order: 40
  }
})
