import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/_other')({
  component: () => <Outlet />,
  staticData: {
    title: '其他',
    order: 100
  }
})
