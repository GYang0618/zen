import { createFileRoute } from '@tanstack/react-router'

import { DictDetail } from '@/features/system/dict'

function DictDetailRoute() {
  const { id } = Route.useParams()
  return <DictDetail dictId={id} />
}

export const Route = createFileRoute('/_authenticated/system/dict_/$id')({
  component: DictDetailRoute,
  staticData: {
    title: '字典详情',
    hideInMenu: true,
    permissions: ['system:dict:list']
  }
})
