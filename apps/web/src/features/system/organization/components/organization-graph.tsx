import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow
} from '@xyflow/react'
import {
  Button,
  ButtonGroup,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import {
  ArrowDownFromLine,
  ArrowRightFromLine,
  ChevronsDownUp,
  ChevronsUpDown,
  Network
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useTheme } from '@/context/theme-provider'

import { buildOrganizationGraph } from '../build-organization-graph'
import { useOrganizations } from '../organizations-provider'
import {
  collectAncestorIds,
  collectExpandableIds,
  collectExpandedIdsToDepth,
  DEFAULT_ORGANIZATION_TREE_EXPAND_DEPTH
} from '../utils'
import { OrganizationGraphActionsProvider } from './organization-graph-context'
import { OrganizationGraphMiniMap } from './organization-graph-minimap'
import { OrganizationGraphNode as OrganizationGraphNodeCard } from './organization-graph-node'

import type { Edge, NodeMouseHandler } from '@xyflow/react'
import type { OrganizationGraphNode, OrganizationGraphRankdir } from '../build-organization-graph'
import type { Organization } from '../type'

const nodeTypes = {
  organization: OrganizationGraphNodeCard
}

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  selectable: false,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: 'var(--muted-foreground)'
  }
}

function createInitialExpandedIds(organizations: Organization[], selectedId?: string) {
  const expanded = new Set(
    collectExpandedIdsToDepth(organizations, DEFAULT_ORGANIZATION_TREE_EXPAND_DEPTH)
  )
  if (selectedId) {
    for (const ancestorId of collectAncestorIds(organizations, selectedId)) {
      expanded.add(ancestorId)
    }
  }
  return expanded
}

function OrganizationGraphCanvas({
  nodes,
  edges,
  layoutKey,
  rankdir,
  onToggleExpand,
  onSelect,
  onClear
}: {
  nodes: OrganizationGraphNode[]
  edges: Edge[]
  layoutKey: string
  rankdir: OrganizationGraphRankdir
  onToggleExpand: (id: string) => void
  onSelect: NodeMouseHandler<OrganizationGraphNode>
  onClear: () => void
}) {
  const { fitView } = useReactFlow()
  const { resolvedTheme } = useTheme()
  const actions = useMemo(() => ({ onToggleExpand, rankdir }), [onToggleExpand, rankdir])
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes)

  useEffect(() => {
    setFlowNodes(nodes)
  }, [nodes, setFlowNodes])

  useEffect(() => {
    if (!layoutKey || nodes.length === 0) return
    const frame = window.requestAnimationFrame(() => {
      void fitView({ padding: 0.2, duration: 220 })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [fitView, layoutKey, nodes.length])

  return (
    <OrganizationGraphActionsProvider value={actions}>
      <ReactFlow
        nodes={flowNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        colorMode={resolvedTheme}
        fitView
        minZoom={0.25}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onlyRenderVisibleElements
        panOnScroll
        selectionOnDrag={false}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        onNodesChange={onNodesChange}
        onNodeClick={onSelect}
        onPaneClick={onClear}
        className="h-full bg-background [--xy-edge-stroke-default:var(--border)] [--xy-edge-stroke-selected-default:var(--primary)]"
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls
          showInteractive={false}
          className="overflow-hidden rounded-lg border border-border bg-background shadow-none"
        />
        <OrganizationGraphMiniMap />
      </ReactFlow>
    </OrganizationGraphActionsProvider>
  )
}

export function OrganizationGraph() {
  const { organizations, currentNode, setCurrentNode, isLoading } = useOrganizations()
  const expandableIds = useMemo(() => collectExpandableIds(organizations), [organizations])
  const [rankdir, setRankdir] = useState<OrganizationGraphRankdir>('TB')
  const [expandedIds, setExpandedIds] = useState(() =>
    createInitialExpandedIds(organizations, currentNode?.id)
  )
  const didInitExpandedRef = useRef(organizations.length > 0)

  useEffect(() => {
    if (didInitExpandedRef.current || organizations.length === 0) return
    didInitExpandedRef.current = true
    setExpandedIds(createInitialExpandedIds(organizations, currentNode?.id))
  }, [currentNode?.id, organizations])

  const layout = useMemo(
    () => buildOrganizationGraph(organizations, { expandedIds, rankdir }),
    [expandedIds, organizations, rankdir]
  )

  const nodes = useMemo(
    () =>
      layout.nodes.map((node) => ({
        ...node,
        selected: node.id === currentNode?.id
      })),
    [currentNode?.id, layout.nodes]
  )

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelect = useCallback<NodeMouseHandler<OrganizationGraphNode>>(
    (_event, node) => {
      const organization = node.data.organization
      if (currentNode?.id === organization.id) {
        setCurrentNode(null)
        return
      }
      setCurrentNode(organization)
    },
    [currentNode?.id, setCurrentNode]
  )

  return (
    <Card className="flex h-full min-h-0 flex-col py-3">
      <CardHeader>
        <CardTitle>组织图谱</CardTitle>
        <CardAction className="flex items-center gap-1">
          <ButtonGroup>
            <Button
              type="button"
              size="icon-sm"
              variant={rankdir === 'TB' ? 'default' : 'outline'}
              aria-label="自上而下布局"
              aria-pressed={rankdir === 'TB'}
              onClick={() => setRankdir('TB')}
            >
              <ArrowDownFromLine />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant={rankdir === 'LR' ? 'default' : 'outline'}
              aria-label="自左向右布局"
              aria-pressed={rankdir === 'LR'}
              onClick={() => setRankdir('LR')}
            >
              <ArrowRightFromLine />
            </Button>
          </ButtonGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="全部展开"
                onClick={() => setExpandedIds(new Set(expandableIds))}
              >
                <ChevronsUpDown />
              </Button>
            </TooltipTrigger>
            <TooltipContent>全部展开</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="全部收起"
                onClick={() => setExpandedIds(new Set())}
              >
                <ChevronsDownUp />
              </Button>
            </TooltipTrigger>
            <TooltipContent>全部收起</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-0">
        {isLoading ? (
          <div className="flex h-full min-h-80 flex-col gap-3 px-4">
            <Skeleton className="h-full min-h-80 rounded-xl" />
          </div>
        ) : organizations.length === 0 ? (
          <Empty className="h-full min-h-80">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Network />
              </EmptyMedia>
              <EmptyTitle>暂无组织</EmptyTitle>
              <EmptyDescription>请先创建根组织后再查看图谱</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="h-full min-h-80">
            <ReactFlowProvider>
              <OrganizationGraphCanvas
                nodes={nodes}
                edges={layout.edges}
                layoutKey={`${rankdir}:${layout.nodes.map((node) => node.id).join(',')}`}
                rankdir={rankdir}
                onToggleExpand={handleToggleExpand}
                onSelect={handleSelect}
                onClear={() => setCurrentNode(null)}
              />
            </ReactFlowProvider>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
