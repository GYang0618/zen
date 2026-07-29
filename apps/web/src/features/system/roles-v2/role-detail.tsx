import {
  Badge,
  Button,
  Label,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Copy,
  KeyRound,
  Pencil,
  Radar,
  Shield,
  Users
} from 'lucide-react'

import { AppHeader, Main } from '@/components/layouts'

import { PermissionMatrix } from './components/permission-matrix'
import { RoleAuditTimelineCard } from './components/role-audit-timeline-card'
import { RoleBasicInfoCard } from './components/role-basic-info-card'
import { RoleMembers } from './components/role-members'
import { RoleRelatedMembersCard } from './components/role-related-members-card'
import { RoleScope } from './components/role-scope'

import type { RoleBasicInfoItem } from './components/role-basic-info-card'
import type { RoleMemberPreview } from './components/role-related-members-card'
import type { TimelineItem } from './components/timeline'

const roleBasicInfoItems: RoleBasicInfoItem[] = [
  {
    icon: <Building2 size={14} />,
    label: '组织',
    value: '阿里巴巴'
  },
  {
    icon: <CalendarClock size={14} />,
    label: '有效期至',
    value: '无限制'
  },
  {
    icon: <Radar size={14} />,
    label: '数据范围',
    value: (
      <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
        全部数据
      </Badge>
    )
  }
]

const roleRelatedMembers: RoleMemberPreview[] = Array.from({ length: 11 }, (_, index) => ({
  id: `member-${index + 1}`,
  name: 'Miubai',
  avatarUrl: 'https://github.com/shadcn.png',
  fallback: 'Mi'
}))

const roleAuditTimeline: TimelineItem[] = [
  {
    title: '缪白',
    timestamp: '今天',
    description: '新增了创建用户、更新用户、删除用户权限'
  },
  {
    title: '小哀',
    timestamp: '昨天',
    description: '更新了用户信息'
  },
  {
    title: '小抑',
    timestamp: '2026-07-27',
    description: '添加了艾米、露丝卡等成员'
  }
]

export function RoleDetail() {
  return (
    <>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="outline" className="size-10 rounded-full">
              <ArrowLeft />
            </Button>
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Shield className="text-slate-500 dark:text-slate-50" />
            </div>

            <div className="flex min-w-0 flex-col gap-3">
              <h1 className="text-4xl font-medium tracking-tight">超级管理员</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  激活
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">super_admin</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-2 rounded-full border">
              <Switch id="active" defaultChecked />
              <Label htmlFor="active">激活</Label>
            </div>
            <Separator orientation="vertical" className="h-8 data-vertical:self-center" />
            <Button variant="outline">
              <Pencil /> 编辑
            </Button>

            <Button variant="outline">
              <Copy /> 克隆
            </Button>
          </div>
        </div>

        <Tabs defaultValue="permissions" className="w-full">
          <TabsList variant="line" className="mb-4 group-data-horizontal/tabs:h-12">
            <TabsTrigger value="permissions">
              <KeyRound className="size-3.5" aria-hidden />
              权限矩阵 (36)
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="size-3.5" aria-hidden />
              关联用户 (5)
            </TabsTrigger>
            <TabsTrigger value="scope">
              <Shield className="size-3.5" aria-hidden />
              数据边界
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-6 @5xl/content:flex-row">
            <div className="min-w-0 flex-1">
              <TabsContent value="permissions">
                <PermissionMatrix />
              </TabsContent>
              <TabsContent value="users">
                <RoleMembers />
              </TabsContent>
              <TabsContent value="scope">
                <RoleScope />
              </TabsContent>
            </div>

            <div className="bg-muted/35 flex w-full shrink-0 flex-col gap-4 rounded-[28px] border border-dashed p-3 @5xl/content:w-90 @5xl/content:self-start">
              <RoleBasicInfoCard items={roleBasicInfoItems} />
              <RoleRelatedMembersCard members={roleRelatedMembers} />
              <RoleAuditTimelineCard data={roleAuditTimeline} />
            </div>
          </div>
        </Tabs>
      </Main>
    </>
  )
}
