import {
  Badge,
  Button,
  Label,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderMedia,
  PageHeaderTitle,
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

import type { RoleAuditTimelineItem } from './components/role-audit-timeline-card'
import type { RoleBasicInfoItem } from './components/role-basic-info-card'
import type { RoleMemberPreview } from './components/role-related-members-card'

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

const roleAuditTimeline: RoleAuditTimelineItem[] = [
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
        <PageHeader>
          <Button variant="outline" size="icon-lg" className="rounded-full">
            <ArrowLeft />
          </Button>
          <PageHeaderMedia className="bg-slate-100 text-slate-500 dark:text-slate-50">
            <Shield />
          </PageHeaderMedia>
          <PageHeaderContent>
            <PageHeaderTitle size="lg" as="h1" className="text-4xl">
              超级管理员
            </PageHeaderTitle>
            <PageHeaderDescription className="flex flex-wrap items-center gap-2 text-sm">
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
              >
                激活
              </Badge>
              <span>•</span>
              <span>super_admin</span>
            </PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions className="gap-3">
            <div className="flex items-center gap-3 rounded-full border px-3 py-2">
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
          </PageHeaderActions>
        </PageHeader>

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
