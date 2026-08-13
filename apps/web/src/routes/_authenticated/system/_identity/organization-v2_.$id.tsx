import { createFileRoute } from '@tanstack/react-router'

import { OrganizationDetail } from '@/features/system/organization-v2/organization-detail'

function OrganizationDetailRoute() {
  const { id } = Route.useParams()
  return <OrganizationDetail organizationId={id} />
}

export const Route = createFileRoute('/_authenticated/system/_identity/organization-v2_/$id')({
  component: OrganizationDetailRoute,
  staticData: {
    title: '组织详情',
    hideInMenu: true,
    permissions: ['system:org:list']
  }
})
