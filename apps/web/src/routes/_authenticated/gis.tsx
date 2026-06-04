import { createFileRoute } from '@tanstack/react-router'

import { CesiumScreen } from '@/features/gis'

export const Route = createFileRoute('/_authenticated/gis')({
  component: CesiumScreen
})
