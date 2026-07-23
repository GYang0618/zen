import { createFileRoute } from '@tanstack/react-router'

import { ChangePasswordPage } from '@/features/auth/change-password'

export const Route = createFileRoute('/_authenticated/change-password')({
  component: ChangePasswordPage,
  staticData: {
    title: '修改密码',
    hideInMenu: true,
    hideInBreadcrumb: false
  }
})
