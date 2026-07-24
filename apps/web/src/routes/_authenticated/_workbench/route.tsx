import { createFileRoute, Outlet } from '@tanstack/react-router'

/** 工作台域 pathless layout：仅提供侧栏组标签，不贡献 URL */
export const Route = createFileRoute('/_authenticated/_workbench')({
  component: () => <Outlet />,
  staticData: {
    title: '工作台',
    order: 1,
  }
})
