import { createFileRoute, Outlet } from '@tanstack/react-router'

/** 系统域 layout：侧栏组标签，不作为折叠父级 */
export const Route = createFileRoute('/_authenticated/system')({
  component: () => <Outlet />,
  staticData: {
    title: '系统',
    order: 3,
  }
})
