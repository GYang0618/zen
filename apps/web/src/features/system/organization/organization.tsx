import { getRouteApi } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import { Button } from '@zen/ui'
import { Building2, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ConfigDrawer, ConfirmDialog, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Can } from '@/components/auth/can'
import { Header, Main } from '@/components/layouts'
import { EmptyState, SystemPageHeader } from '@/features/system/components'

import { Copilot } from './copilot'
import { CreateOrganizationDialog } from './create-organization-dialog'
import { OrgDetailPanel } from './org-detail-panel'
import { OrgTreeSidebar } from './org-tree-sidebar'
import { useDeleteOrganizations, useOrganizationTree } from './queries'
import { filterOrganizationTree, findOrganizationNode, flattenOrganizationTree } from './utils'

const route = getRouteApi('/_authenticated/system/_identity/organization')

export function Organizations() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isLoading } = useOrganizationTree()
  const deleteMutation = useDeleteOrganizations()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(search.orgId ?? null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const keyword = search.keyword ?? ''
  const tree = data ?? []
  const displayTree = useMemo(() => filterOrganizationTree(tree, keyword), [keyword, tree])

  const parentOptions = useMemo(() => flattenOrganizationTree(tree), [tree])

  const selectedNode = useMemo(
    () => (selectedId ? findOrganizationNode(tree, selectedId) : null),
    [tree, selectedId]
  )

  useEffect(() => {
    if (search.orgId) {
      setSelectedId(search.orgId)
    }
  }, [search.orgId])

  useEffect(() => {
    if (isLoading) return
    if (selectedId && findOrganizationNode(tree, selectedId)) return
    const fallbackId = displayTree[0]?.id ?? tree[0]?.id ?? null
    setSelectedId(fallbackId)
  }, [displayTree, isLoading, selectedId, tree])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    navigate({
      search: (prev) => ({
        ...prev,
        orgId: id
      })
    })
  }

  const handleKeywordChange = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        keyword: value.trim() || undefined
      })
    })
  }

  const deleteTarget = parentOptions.find((node) => node.id === deleteId)

  return (
    <>
      <Copilot />
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
          title="组织架构"
          description="维护统一组织树、岗位编制与人员花名册"
          actions={
            <Can permission={PermissionCode.ORG_CREATE}>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus data-icon="inline-start" />
                新建部门
              </Button>
            </Can>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <OrgTreeSidebar
            tree={displayTree}
            selectedId={selectedId}
            keyword={keyword}
            isLoading={isLoading}
            onSelect={handleSelect}
            onCreate={() => setDialogOpen(true)}
            onKeywordChange={handleKeywordChange}
          />

          {selectedNode ? (
            <OrgDetailPanel
              key={selectedNode.id}
              organization={selectedNode}
              tree={tree}
              parentOptions={parentOptions}
              onRequestDelete={setDeleteId}
            />
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-xl border bg-card">
              <EmptyState
                icon={Building2}
                title="选择组织节点"
                description="从左侧选择组织，以管理岗位与人员编制"
              />
            </div>
          )}
        </div>
      </Main>

      <CreateOrganizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parentOptions={parentOptions}
        defaultParentId={selectedId}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null)
        }}
        title="删除组织？"
        desc={
          deleteTarget
            ? `确认删除「${deleteTarget.name}」及其关联配置？若存在下级或成员，可能删除失败。`
            : '确认删除该组织？'
        }
        confirmText="删除"
        cancelBtnText="取消"
        destructive
        isLoading={deleteMutation.isPending}
        handleConfirm={() => {
          if (!deleteId) return
          deleteMutation.mutate([deleteId], {
            onSuccess: () => {
              if (selectedId === deleteId) setSelectedId(null)
              setDeleteId(null)
            }
          })
        }}
      />
    </>
  )
}
