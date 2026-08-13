import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { RolesDialogs } from './components/roles-dialogs'
import { RolesList } from './components/roles-list'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesProvider } from './roles-provider'

function RolesContent() {
  return (
    <>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader actions={<RolesPrimaryButtons />} />
        <RolesList />
      </Main>

      <RolesDialogs />
    </>
  )
}

export function Roles() {
  return (
    <RolesProvider>
      <RolesContent />
    </RolesProvider>
  )
}
