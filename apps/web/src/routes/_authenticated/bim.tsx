import { createFileRoute } from '@tanstack/react-router'

import { BIMScreen } from '@/features/bim'

export const Route = createFileRoute('/_authenticated/bim')({
  component: BIMScreen
})
