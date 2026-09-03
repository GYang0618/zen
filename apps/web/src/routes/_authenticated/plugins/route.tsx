import { createFileRoute, Outlet } from '@tanstack/react-router'

/** 插件域 layout：侧栏组标签 */
export const Route = createFileRoute('/_authenticated/plugins')({
  component: () => <Outlet />,
  staticData: {
    title: '插件系统',
    order: 4
  }
})
