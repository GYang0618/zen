import { createFileRoute } from '@tanstack/react-router'

import { RoleDetail } from '@/features/system/roles-v2/role-detail'

export const Route = createFileRoute('/_authenticated/system/_identity/roles-v2_/$id')({
  component: RoleDetail
})
