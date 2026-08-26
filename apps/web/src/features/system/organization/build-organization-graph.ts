import dagre, { graphlib } from '@dagrejs/dagre'

import type { Edge, Node } from '@xyflow/react'
import type { Organization } from './type'

export const ORGANIZATION_GRAPH_NODE_WIDTH = 272
export const ORGANIZATION_GRAPH_NODE_HEIGHT = 120

export type OrganizationGraphRankdir = 'TB' | 'LR'

export type OrganizationGraphNodeData = {
  organization: Organization
  hasChildren: boolean
  isExpanded: boolean
  hiddenChildCount: number
}

export type OrganizationGraphNode = Node<OrganizationGraphNodeData, 'organization'>

const NODE_SEPARATION = 32
const RANK_SEPARATION = 64

export function collectVisibleOrganizations(
  nodes: Organization[],
  expandedIds: ReadonlySet<string>
): Organization[] {
  const visible: Organization[] = []

  const walk = (list: Organization[]) => {
    for (const node of list) {
      visible.push(node)
      if (node.children?.length && expandedIds.has(node.id)) {
        walk(node.children)
      }
    }
  }

  walk(nodes)
  return visible
}

function isDagrePoint(value: unknown): value is { x: number; y: number } {
  if (typeof value !== 'object' || value === null) return false
  const point = value as { x?: unknown; y?: unknown }
  return typeof point.x === 'number' && typeof point.y === 'number'
}

function layoutOrganizationGraph(
  nodes: OrganizationGraphNode[],
  edges: Edge[],
  rankdir: OrganizationGraphRankdir
): { nodes: OrganizationGraphNode[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges }

  const dagreGraph = new graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir,
    nodesep: NODE_SEPARATION,
    ranksep: RANK_SEPARATION
  })

  for (const node of nodes) {
    dagreGraph.setNode(node.id, {
      width: ORGANIZATION_GRAPH_NODE_WIDTH,
      height: ORGANIZATION_GRAPH_NODE_HEIGHT
    })
  }

  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target)
  }

  dagre.layout(dagreGraph)

  return {
    nodes: nodes.map((node) => {
      const laidOut = dagreGraph.node(node.id)
      const x = isDagrePoint(laidOut) ? laidOut.x : 0
      const y = isDagrePoint(laidOut) ? laidOut.y : 0

      return {
        ...node,
        position: {
          x: x - ORGANIZATION_GRAPH_NODE_WIDTH / 2,
          y: y - ORGANIZATION_GRAPH_NODE_HEIGHT / 2
        }
      }
    }),
    edges
  }
}

export function buildOrganizationGraph(
  organizations: Organization[],
  options: {
    expandedIds: ReadonlySet<string>
    rankdir?: OrganizationGraphRankdir
  }
): { nodes: OrganizationGraphNode[]; edges: Edge[] } {
  const rankdir = options.rankdir ?? 'TB'
  const visible = collectVisibleOrganizations(organizations, options.expandedIds)
  const visibleIds = new Set(visible.map((node) => node.id))
  const isHorizontal = rankdir === 'LR'

  const nodes: OrganizationGraphNode[] = visible.map((organization) => {
    const hasChildren = Boolean(organization.children?.length)
    const isExpanded = options.expandedIds.has(organization.id)

    return {
      id: organization.id,
      type: 'organization',
      position: { x: 0, y: 0 },
      data: {
        organization,
        hasChildren,
        isExpanded,
        hiddenChildCount: hasChildren && !isExpanded ? (organization.children?.length ?? 0) : 0
      },
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      targetPosition: isHorizontal ? 'left' : 'top',
      connectable: false,
      draggable: false,
      width: ORGANIZATION_GRAPH_NODE_WIDTH,
      height: ORGANIZATION_GRAPH_NODE_HEIGHT,
      initialWidth: ORGANIZATION_GRAPH_NODE_WIDTH,
      initialHeight: ORGANIZATION_GRAPH_NODE_HEIGHT,
      style: {
        width: ORGANIZATION_GRAPH_NODE_WIDTH,
        height: ORGANIZATION_GRAPH_NODE_HEIGHT
      }
    }
  })

  const edges: Edge[] = visible.flatMap((organization) => {
    if (!organization.children?.length || !options.expandedIds.has(organization.id)) return []

    return organization.children
      .filter((child) => visibleIds.has(child.id))
      .map((child) => ({
        id: `${organization.id}-${child.id}`,
        source: organization.id,
        target: child.id,
        type: 'smoothstep',
        selectable: false,
        focusable: false
      }))
  })

  return layoutOrganizationGraph(nodes, edges, rankdir)
}
