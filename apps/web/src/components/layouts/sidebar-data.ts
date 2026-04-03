import {
  AudioWaveform,
  Bell,
  Command,
  GalleryVerticalEnd,
  HelpCircle,
  LayoutDashboard,
  Monitor,
  Palette,
  Settings,
  UserCog,
  Wrench
} from 'lucide-react'
import type { SidebarData } from './types'
export const sidebarData: SidebarData = {
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI'
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise'
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup'
    }
  ],
  user: { name: '缪白', email: 'miao.bai@example.com', avatar: '/path/to/avatar.jpg' },
  navGroups: [
    {
      title: '平台',
      items: [
        {
          title: '仪表盘',
          url: '/',
          icon: LayoutDashboard
        }
      ]
    },
    {
      title: '其他',
      items: [
        {
          title: '设置',
          icon: Settings,
          items: [
            {
              title: '个人资料',
              url: '/settings/profile',
              icon: UserCog
            },
            {
              title: '账户',
              url: '/settings/account',
              icon: Wrench
            },
            {
              title: '外观',
              url: '/settings/appearance',
              icon: Palette
            },
            {
              title: '通知',
              url: '/settings/notifications',
              icon: Bell
            },
            {
              title: '显示',
              url: '/settings/display',
              icon: Monitor
            }
          ]
        },
        {
          title: '帮助中心',
          url: '/help-center',
          icon: HelpCircle
        }
      ]
    }
  ]
}
