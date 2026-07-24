import { getRouteApi } from '@tanstack/react-router'
import { Shield } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfigDrawer, ConfirmDialog, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { EmptyState, SystemPageHeader } from '@/features/system/components'

import { RoleDetailPanel } from './components/role-detail-panel'
import { RolesDialogs } from './components/roles-dialogs'
import { RolesSidebar } from './components/roles-sidebar'
import { useRolesQuery } from './queries'
import { RolesProvider, useRoles } from './roles-provider'

import type { RoleListFilter } from './components/roles-sidebar'

const route = getRouteApi('/_authenticated/system/_identity/roles')

function RolesWorkspace() {
  const search = route.useSearch()
  const { setOpen, setCurrentRow } = useRoles()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState(search.keyword ?? '')
  const [filter, setFilter] = useState<RoleListFilter>('all')
  const [isDirty, setIsDirty] = useState(false)
  const [pendingSelectId, setPendingSelectId] = useState<string | null>(null)

  const { data, isLoading } = useRolesQuery({
    page: 1,
    pageSize: 100,
    keyword: keyword.trim() || undefined
  })

  const roles = data?.items ?? []

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      if (filter === 'system') return role.isSystem
      if (filter === 'custom') return !role.isSystem
      return true
    })
  }, [roles, filter])

  const selectedRole =
    filteredRoles.find((role) => role.id === selectedId) ??
    roles.find((role) => role.id === selectedId) ??
    null

  useEffect(() => {
    if (isLoading) return
    if (selectedId && roles.some((role) => role.id === selectedId)) return
    setSelectedId(filteredRoles[0]?.id ?? roles[0]?.id ?? null)
  }, [filteredRoles, isLoading, roles, selectedId])

  const handleSelect = (id: string) => {
    if (isDirty && id !== selectedId) {
      setPendingSelectId(id)
      return
    }
    setSelectedId(id)
  }

  const handleConfirmSwitch = () => {
    if (!pendingSelectId) return
    setSelectedId(pendingSelectId)
    setPendingSelectId(null)
    setIsDirty(false)
  }

  const handleCreate = () => {
    if (isDirty) {
      toast.message('请先保存或放弃当前配置修改')
      return
    }
    setCurrentRow(null)
    setOpen('add')
  }

  const handleDelete = (role: (typeof roles)[number]) => {
    setCurrentRow(role)
    setOpen('delete')
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <SystemPageHeader
          title="角色管理"
          description="以主从视图配置角色权限、数据范围与关联用户"
        />

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <RolesSidebar
            roles={filteredRoles}
            selectedId={selectedId}
            keyword={keyword}
            filter={filter}
            isLoading={isLoading}
            onKeywordChange={setKeyword}
            onFilterChange={setFilter}
            onSelect={handleSelect}
            onCreate={handleCreate}
          />

          {selectedRole ? (
            <RoleDetailPanel
              key={selectedRole.id}
              role={selectedRole}
              onDelete={handleDelete}
              onRoleCreated={setSelectedId}
              onDirtyChange={setIsDirty}
            />
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-xl border bg-card">
              <EmptyState
                icon={Shield}
                title="选择一个角色"
                description="从左侧列表选择角色，配置功能权限、数据边界与关联用户"
              />
            </div>
          )}
        </div>
      </Main>

      <RolesDialogs
        onCreated={(roleId) => {
          setSelectedId(roleId)
        }}
        onDeleted={(roleId) => {
          if (selectedId === roleId) {
            setSelectedId(null)
          }
        }}
      />

      <ConfirmDialog
        open={pendingSelectId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSelectId(null)
        }}
        title="丢弃未保存的修改？"
        desc="切换角色将丢弃当前权限与数据边界的草稿修改，此操作不可撤销。"
        confirmText="丢弃并切换"
        destructive
        handleConfirm={handleConfirmSwitch}
      />
    </>
  )
}

export function Roles() {
  return (
    <RolesProvider>
      <RolesWorkspace />
    </RolesProvider>
  )
}
