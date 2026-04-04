import {
  Activity,
  AudioWaveform,
  Bell,
  Bot,
  Building2,
  ChartColumn,
  ClipboardList,
  Command,
  FolderKanban,
  GalleryVerticalEnd,
  GitBranch,
  HardDrive,
  HelpCircle,
  KeyRound,
  Layers,
  LayoutDashboard,
  Library,
  Lock,
  Logs,
  Monitor,
  Palette,
  Radar,
  Settings,
  ShieldCheck,
  ShieldEllipsis,
  UserRound,
  UserRoundCog,
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
  user: {
    name: '缪白',
    email: 'miao.bai@example.com',
    avatar: '/path/to/avatar.jpg'
  },
  navGroups: [
    {
      title: '工作台',
      items: [
        {
          title: '概览',
          url: '/workspace/overview',
          icon: LayoutDashboard
        },
        {
          title: '我的待办',
          url: '/workspace/tasks',
          icon: ClipboardList
        }
      ]
    },
    {
      title: '业务',
      items: [
        {
          title: '数据分析',
          url: '/business/analytics',
          icon: ChartColumn
        },
        {
          title: '数据治理',
          url: '/governance/data-quality',
          icon: ShieldCheck
        },
        {
          title: '元数据管理',
          url: '/data-catalog/metadata',
          icon: Layers
        }
      ]
    },
    {
      title: 'AI 智能',
      items: [
        {
          title: 'Agent中心',
          url: '/ai/agents',
          icon: Bot
        },
        {
          title: '自动化与流程',
          url: '/automation/workflows',
          icon: GitBranch
        },
        {
          title: '提示词仓库',
          url: '/ai/prompt-library',
          icon: Library
        }
      ]
    },

    {
      title: '系统',
      items: [
        {
          title: '组织与权限',
          icon: Building2,
          items: [
            {
              title: '成员管理',
              url: '/system/iam/members',
              icon: UserRoundCog
            },
            {
              title: '角色与权限',
              url: '/system/iam/roles',
              icon: KeyRound
            },
            {
              title: '组织架构',
              url: '/system/organization/structure',
              icon: FolderKanban
            }
          ]
        },
        {
          title: '监控与安全',
          icon: Radar,
          items: [
            {
              title: '资源监控',
              url: '/system/observability/resources',
              icon: Activity
            },
            {
              title: '系统日志',
              url: '/system/observability/logs',
              icon: Logs
            },
            {
              title: '安全中心',
              url: '/system/security/center',
              icon: ShieldEllipsis
            },
            {
              title: '审计日志',
              url: '/system/security/audit-logs',
              icon: HardDrive
            }
          ]
        },
        {
          title: '安全中心',
          icon: ShieldCheck,
          items: [
            {
              title: '资源监控',
              url: '/system/security/resource-posture',
              icon: Activity
            }
          ]
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
              url: '/account/profile',
              icon: UserRound
            },
            {
              title: '账户',
              url: '/account/credentials',
              icon: Wrench
            },
            {
              title: '安全',
              url: '/account/security',
              icon: Lock
            },
            {
              title: '外观',
              url: '/preferences/appearance',
              icon: Palette
            },
            {
              title: '通知',
              url: '/preferences/notifications',
              icon: Bell
            },
            {
              title: '显示',
              url: '/preferences/display',
              icon: Monitor
            }
          ]
        },
        {
          title: '帮助中心',
          url: '/support/help-center',
          icon: HelpCircle
        }
      ]
    }
  ]
}
