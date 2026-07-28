import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Edit,
  KeyRound,
  Radar,
  Shield,
  Snowflake,
  Users
} from 'lucide-react'

import { AppHeader, Main } from '@/components/layouts'

import { PermissionMatrix } from './components/permission-matrix'
import { RoleMembers } from './components/role-members'
import { RoleScope } from './components/role-scope'

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
          <div className="flex gap-2">
            <Button variant="outline">
              <Snowflake />
              冻结角色
            </Button>
            <Button variant="outline">
              <Edit />
              编辑信息
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
          <TabsContent value="permissions">
            <div className="flex gap-6">
              <div className="flex-1">
                <PermissionMatrix />
              </div>
              <div className="w-90 bg-muted/35 flex flex-col gap-4 rounded-[28px] border border-dashed p-3 xl:self-start">
                <Card>
                  <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2 ">
                          <Building2 size={14} /> 组织
                        </span>
                        <span className="font-medium">阿里巴巴</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2 text-sm">
                          <CalendarClock size={14} /> 有效期至
                        </span>
                        <span className="font-medium">无限制</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2 text-sm">
                          <Radar size={14} /> 数据范围
                        </span>
                        <span className="font-medium">
                          <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            全部数据
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>关联成员</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 flex-wrap">
                      {[...new Array(11).fill(null)].map((_, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger>
                            <Avatar key={index}>
                              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                              <AvatarFallback>Mi</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>Miubai</TooltipContent>
                        </Tooltip>
                      ))}
                      <div className="size-8 text-muted-foreground rounded-full flex justify-center items-center">
                        +10
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>审计日志</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      <div className="grid grid-cols-[24px_1fr] gap-3">
                        <div className="relative flex justify-center pt-1.5">
                          <span className="bg-foreground size-2.5 rounded-full"></span>
                          <span className="bg-border absolute top-5 -bottom-5.5 w-px"></span>
                        </div>
                        <div>
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-semibold">缪白</p>
                            <span className="text-muted-foreground shrink-0 text-xs">今天</span>
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm leading-6">
                            新增了创建用户、更新用户、删除用户权限
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-[24px_1fr] gap-3">
                        <div className="relative flex justify-center pt-1.5">
                          <span className="bg-muted-foreground/40 size-2.5 rounded-full"></span>
                          <span className="bg-border absolute top-5 -bottom-5.5 w-px"></span>
                        </div>
                        <div>
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-semibold">小哀</p>
                            <span className="text-muted-foreground shrink-0 text-xs">昨天</span>
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm leading-6">
                            更新了用户信息
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-[24px_1fr] gap-3">
                        <div className="relative flex justify-center pt-1.5">
                          <span className="bg-muted-foreground/40 size-2.5 rounded-full"></span>
                        </div>
                        <div>
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-semibold">小抑</p>
                            <span className="text-muted-foreground shrink-0 text-xs">
                              2026-07-27
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm leading-6">
                            添加了艾米、露丝卡等成员
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="users">
            <RoleMembers />
          </TabsContent>
          <TabsContent value="scope">
            <RoleScope />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
