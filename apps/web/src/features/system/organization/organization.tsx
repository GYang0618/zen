import { PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton
} from '@zen/ui'
import { Building2, ChevronRight, Network, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ConfigDrawer, ConfirmDialog, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Can } from '@/components/auth/can'
import { Header, Main } from '@/components/layouts'
import { EmptyState, SystemPageHeader } from '@/features/system/components'

import { CreateOrganizationDialog } from './create-organization-dialog'
import { OrgDetailPanel } from './org-detail-panel'
import { useDeleteOrganizations, useOrganizationTree } from './queries'

import type { OrganizationTreeNode } from '@zen/shared'

function OrganizationNode({
  node,
  depth,
  selectedId,
  onSelect,
  onDelete
}: {
  node: OrganizationTreeNode
  depth: number
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children.length > 0
  const selected = selectedId === node.id

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 rounded-lg py-1.5 pe-1.5 transition-colors ${
          selected
            ? 'bg-primary/10 ring-1 ring-primary/20'
            : 'hover:bg-muted/70'
        }`}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
      >
        <button
          type="button"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-40"
          onClick={() => setOpen((value) => !value)}
          disabled={!hasChildren}
          aria-label={open ? '折叠' : '展开'}
        >
          {hasChildren ? (
            <ChevronRight className={`size-4 transition-transform ${open ? 'rotate-90' : ''}`} />
          ) : (
            <span className="inline-block size-4" />
          )}
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 rounded-md px-1 py-0.5 text-left"
          onClick={() => onSelect(node.id)}
        >
          <div className="truncate text-sm font-medium">{node.name}</div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono">{node.code}</span>
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              {node.type}
            </Badge>
            <span>成员 {node.memberCount}</span>
            {node.leaderName ? <span>· {node.leaderName}</span> : null}
          </div>
        </button>
        <Can permission={PermissionCode.ORG_DELETE}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => onDelete(node.id)}
            aria-label="删除组织"
          >
            <Trash2 />
          </Button>
        </Can>
      </div>
      {open &&
        node.children.map((child) => (
          <OrganizationNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
    </div>
  )
}

export function Organizations() {
  const { data, isLoading } = useOrganizationTree()
  const deleteMutation = useDeleteOrganizations()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const parentOptions = useMemo(() => {
    const flatten = (nodes: OrganizationTreeNode[], acc: OrganizationTreeNode[] = []) => {
      for (const node of nodes) {
        acc.push(node)
        flatten(node.children, acc)
      }
      return acc
    }
    return flatten(data ?? [])
  }, [data])

  const deleteTarget = parentOptions.find((node) => node.id === deleteId)

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
          title="组织架构"
          description="维护统一组织树、成员归属与岗位"
          actions={
            <Can permission={PermissionCode.ORG_CREATE}>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus data-icon="inline-start" />
                新建组织
              </Button>
            </Can>
          }
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card size="sm" className="gap-0 py-0">
            <CardHeader className="border-b px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Network className="size-4 text-muted-foreground" aria-hidden />
                组织树
              </CardTitle>
              <CardDescription>点击节点查看右侧详情；悬停可删除</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              {isLoading ? (
                <div className="flex flex-col gap-2 p-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-5/6" />
                  <Skeleton className="h-10 w-4/6" />
                </div>
              ) : (data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="暂无组织"
                  description="请先创建根节点，再挂载下级部门"
                  compact
                  action={
                    <Can permission={PermissionCode.ORG_CREATE}>
                      <Button size="sm" onClick={() => setDialogOpen(true)}>
                        <Plus data-icon="inline-start" />
                        创建根组织
                      </Button>
                    </Can>
                  }
                />
              ) : (
                data?.map((node) => (
                  <OrganizationNode
                    key={node.id}
                    node={node}
                    depth={0}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onDelete={setDeleteId}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {selectedId ? (
            <OrgDetailPanel organizationId={selectedId} />
          ) : (
            <Card>
              <EmptyState
                icon={Building2}
                title="选择组织节点"
                description="从左侧选择组织，以管理成员与岗位"
              />
            </Card>
          )}
        </div>
      </Main>

      <CreateOrganizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parentOptions={parentOptions}
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
