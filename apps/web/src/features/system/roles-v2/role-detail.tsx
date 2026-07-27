import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@zen/ui'
import { ArrowLeft, KeyRound, Shield, Snowflake, Trash2, Users } from 'lucide-react'

import { AppHeader, Main } from '@/components/layouts'

import { RoleScope } from './components/role-scope'

export function RoleDetail() {
  return (
    <>
      <AppHeader />

      <Main fixed className="flex flex-1 flex-col gap-4 sm:gap-6">
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
            <Button variant="destructive">
              <Trash2 />
              冻结角色
            </Button>
          </div>
        </div>

        <Tabs defaultValue="permissions" className="w-full">
          <TabsList>
            <TabsTrigger value="permissions">
              <KeyRound className="size-3.5" aria-hidden />
              权限矩阵
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="size-3.5" aria-hidden />
              关联用户
            </TabsTrigger>
            <TabsTrigger value="scope">
              <Shield className="size-3.5" aria-hidden />
              数据边界
            </TabsTrigger>
          </TabsList>
          <TabsContent value="permissions">
            <div className="flex gap-6">
              <div className="flex-1  border rounded-2xl"></div>
              <div className="w-90 bg-muted/35 flex flex-col gap-4 rounded-[28px] border border-dashed p-3 xl:self-start"></div>
            </div>
          </TabsContent>
          <TabsContent value="users">关联用户</TabsContent>
          <TabsContent value="scope">
            <RoleScope />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
