import { AppHeader, Main } from '@/components/layouts'
import { PageHeader } from '@/components/page-header'

import { RolesDialogs } from './components/roles-dialogs'
import { RolesList } from './components/roles-list'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesProvider } from './roles-provider'

import type { Role } from '@zen/shared'

export function Roles() {
  const roles: Role[] = [
    {
      id: '1',
      name: '超级管理员',
      code: 'super_admin',
      description: '拥有系统用户管理、角色管理等所有的权限，该角色不可以删除',
      permissions: ['1', '2', '3'],
      memberCount: 30,
      status: 'active'
    },
    {
      id: '2',
      name: '游客',
      code: 'guest',
      description: '仅有部分模块的查看权限',
      permissions: ['1', '2'],
      memberCount: 10,
      status: 'disabled'
    }
  ] as Role[]

  return (
    <RolesProvider>
      <AppHeader />

      <Main fixed className="flex flex-1 flex-col gap-4 sm:gap-6">
        <PageHeader
          title="角色管理"
          description="管理系统中的所有角色"
          actions={<RolesPrimaryButtons />}
        />
        <RolesList data={roles} />
      </Main>

      <RolesDialogs />
    </RolesProvider>
  )
}
