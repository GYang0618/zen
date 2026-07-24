import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/ai')({
  component: () => <Outlet />,
  staticData: {
    title: 'AI智能',
    order: 2
  }
})
