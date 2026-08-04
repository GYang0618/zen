import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Settings } from 'lucide-react'

/** 设置域 layout：侧栏组标签；组内扁平菜单由 `_menu` 展开 */
export const Route = createFileRoute('/_authenticated/_other/settings')({
  component: () => <Outlet />,
  staticData: {
    title: '设置',
    description: '管理您的个人资料、账号安全凭证、系统界面外观与通知提醒。',
    icon: Settings,
    order: 1
  }
})
