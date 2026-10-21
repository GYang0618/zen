import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { DictNew } from '@/features/system/dict'

const searchSchema = z.object({
  workspaceId: z.string().optional()
})

function DictNewRoute() {
  const { workspaceId } = Route.useSearch()
  return <DictNew initialWorkspaceId={workspaceId} />
}

export const Route = createFileRoute('/_authenticated/system/dict_/new')({
  validateSearch: searchSchema,
  component: DictNewRoute,
  staticData: {
    title: '新建字典',
    hideInMenu: true,
    permissions: ['system:dict:manage']
  }
})
