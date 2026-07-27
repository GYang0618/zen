import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@zen/ui'
import { KeyRound, Shield, Users } from 'lucide-react'

import { AppHeader, Main } from '@/components/layouts'
import { PageHeader } from '@/components/page-header'

export function RoleDetail() {
  return (
    <>
      <AppHeader />

      <Main fixed className="flex flex-1 flex-col gap-4 sm:gap-6">
        <PageHeader
          title="超级管理员"
          description="管理系统中的所有角色"
          actions={<Button>冻结角色</Button>}
        />

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
          <TabsContent value="permissions">权限矩阵</TabsContent>
          <TabsContent value="users">关联用户</TabsContent>
          <TabsContent value="scope">数据边界</TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
