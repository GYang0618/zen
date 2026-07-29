import { Button } from '@zen/ui'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { AppHeader, Main } from '@/components/layouts'
import { PageHeader } from '@/components/page-header'

import {
  allowedChildTypes,
  CreateOrganizationSheet,
  OrganizationDetailsPanel
} from './components/organization-sheets'
import { OrganizationTree } from './components/organization-tree'
import { flattenOrganizations, organizationTree } from './data'

import type { BasicOrganizationValues } from './components/organization-sheets'
import type { OrganizationNode } from './data'

function updateNode(
  node: OrganizationNode,
  id: string,
  update: (current: OrganizationNode) => OrganizationNode
): OrganizationNode {
  if (node.id === id) return update(node)
  return {
    ...node,
    children: node.children?.map((child) => updateNode(child, id, update))
  }
}

function findParentId(node: OrganizationNode, id: string): string | null {
  if (node.children?.some((child) => child.id === id)) return node.id
  for (const child of node.children ?? []) {
    const parentId = findParentId(child, id)
    if (parentId) return parentId
  }
  return null
}

function containsNode(node: OrganizationNode, id: string): boolean {
  return node.id === id || Boolean(node.children?.some((child) => containsNode(child, id)))
}

function removeNode(
  node: OrganizationNode,
  id: string
): { tree: OrganizationNode; removed: OrganizationNode | null } {
  let removed: OrganizationNode | null = null
  const children: OrganizationNode[] = []

  for (const child of node.children ?? []) {
    if (child.id === id) {
      removed = child
      continue
    }
    const result = removeNode(child, id)
    if (result.removed) removed = result.removed
    children.push(result.tree)
  }

  return { tree: { ...node, children }, removed }
}

export function Organizations() {
  const [root, setRoot] = useState<OrganizationNode>(() => structuredClone(organizationTree))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createParentId, setCreateParentId] = useState(root.id)
  const selectedOrganization = useMemo(
    () => flattenOrganizations(root).find((item) => item.id === selectedId) ?? null,
    [root, selectedId]
  )

  const openCreate = (parentId = selectedId ?? root.id) => {
    const parent = flattenOrganizations(root).find((item) => item.id === parentId)
    if (!parent || allowedChildTypes(parent.type).length === 0) {
      toast.error('该组织类型下不能继续创建下级组织')
      return
    }
    setCreateParentId(parentId)
    setCreateOpen(true)
  }

  const moveOrganization = (nodeId: string, parentId: string) => {
    const nodes = flattenOrganizations(root)
    const source = nodes.find((item) => item.id === nodeId)
    const target = nodes.find((item) => item.id === parentId)

    if (!source || !target || nodeId === root.id) return false
    if (containsNode(source, parentId)) {
      toast.error('不能将组织移动到自身的下级')
      return false
    }
    if (!allowedChildTypes(target.type).includes(source.type)) {
      toast.error(`${target.type}下不能直接放置${source.type}，请保持逐级组织结构`)
      return false
    }
    if (findParentId(root, nodeId) === parentId) {
      toast.info('该组织已在当前上级组织下')
      return false
    }

    const { tree, removed } = removeNode(root, nodeId)
    if (!removed) return false
    setRoot(
      updateNode(tree, parentId, (current) => ({
        ...current,
        children: [...(current.children ?? []), removed]
      }))
    )
    toast.success(`已将${source.name}移动到${target.name}`)
    return true
  }

  return (
    <>
      <AppHeader />
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <PageHeader
          title="组织管理"
          description="查看组织层级，并进入详情管理成员、岗位和组织信息"
          actions={
            <Button onClick={() => openCreate(selectedId ?? root.id)}>
              <Plus data-icon="inline-start" />
              新建组织
            </Button>
          }
        />
        <div
          className={
            selectedOrganization
              ? 'grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]'
              : 'min-w-0'
          }
        >
          <OrganizationTree
            root={root}
            activeId={selectedId}
            onCreate={() => openCreate(selectedId ?? root.id)}
            onMove={moveOrganization}
            onSelect={(id) => setSelectedId((current) => (current === id ? null : id))}
          />
          {selectedOrganization && (
            <OrganizationDetailsPanel
              organization={selectedOrganization}
              onClose={() => setSelectedId(null)}
              onUpdate={(id, values) => {
                setRoot(
                  updateNode(root, id, (current) => ({
                    ...current,
                    ...values,
                    updatedAt: new Date().toLocaleString('zh-CN', { hour12: false })
                  }))
                )
                toast.success('组织基础信息已保存')
              }}
              onCreateChild={openCreate}
            />
          )}
        </div>
      </Main>
      <CreateOrganizationSheet
        root={root}
        parentId={createParentId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(parentId, values: BasicOrganizationValues) => {
          const id = `org-${Date.now()}`
          const newNode: OrganizationNode = {
            id,
            ...values,
            leaderRole: '负责人',
            memberCount: 0,
            headcount: 0,
            location: '待配置',
            updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
            members: [],
            children: []
          }
          setRoot(
            updateNode(root, parentId, (current) => ({
              ...current,
              children: [...(current.children ?? []), newNode]
            }))
          )
          setCreateOpen(false)
          setSelectedId(id)
          toast.success(`${values.name}已创建`)
        }}
      />
    </>
  )
}
