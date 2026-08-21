import { describe, expect, it } from 'vitest'

import {
  buildOrganizationGraph,
  collectVisibleOrganizations,
  ORGANIZATION_GRAPH_NODE_HEIGHT,
  ORGANIZATION_GRAPH_NODE_WIDTH
} from './build-organization-graph'

import type { Organization } from './type'

function organization(
  id: string,
  type: string,
  parentId: string | null = null,
  children: Organization[] = []
): Organization {
  return {
    id,
    name: id,
    code: id,
    type: type.toLowerCase() as Organization['type'],
    description: null,
    effectiveDate: '2026-01-01',
    leader: null,
    memberCount: 0,
    positionCount: 0,
    parentId,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-19T00:00:00.000Z',
    children
  }
}

const organizationTree = [
  organization('group', 'group', null, [
    organization('company-a', 'company', 'group', [
      organization('branch-a', 'branch', 'company-a')
    ]),
    organization('company-b', 'company', 'group')
  ])
]

const forest = [
  organization('group-a', 'group', null, [organization('company-a', 'company', 'group-a')]),
  organization('group-b', 'group', null, [organization('company-b', 'company', 'group-b')])
]

describe('collectVisibleOrganizations', () => {
  it('always includes roots and only walks into expanded nodes', () => {
    expect(collectVisibleOrganizations(organizationTree, new Set()).map((node) => node.id)).toEqual(
      ['group']
    )
    expect(
      collectVisibleOrganizations(organizationTree, new Set(['group'])).map((node) => node.id)
    ).toEqual(['group', 'company-a', 'company-b'])
  })
})

describe('buildOrganizationGraph', () => {
  it('returns empty nodes and edges for an empty tree', () => {
    expect(buildOrganizationGraph([], { expandedIds: new Set() })).toEqual({
      nodes: [],
      edges: []
    })
  })

  it('keeps collapsed children off the canvas and records hidden child count', () => {
    const { nodes, edges } = buildOrganizationGraph(organizationTree, {
      expandedIds: new Set()
    })

    expect(nodes.map((node) => node.id)).toEqual(['group'])
    expect(nodes[0]?.data.hiddenChildCount).toBe(2)
    expect(nodes[0]?.data.isExpanded).toBe(false)
    expect(nodes[0]?.width).toBe(ORGANIZATION_GRAPH_NODE_WIDTH)
    expect(nodes[0]?.height).toBe(ORGANIZATION_GRAPH_NODE_HEIGHT)
    expect(edges).toEqual([])
  })

  it('creates parent-to-child edges for visible expanded nodes', () => {
    const { nodes, edges } = buildOrganizationGraph(organizationTree, {
      expandedIds: new Set(['group'])
    })

    expect(nodes.map((node) => node.id)).toEqual(['group', 'company-a', 'company-b'])
    expect(edges.map((edge) => `${edge.source}->${edge.target}`)).toEqual([
      'group->company-a',
      'group->company-b'
    ])
  })

  it('places children below the parent in a top-down layout', () => {
    const { nodes } = buildOrganizationGraph(organizationTree, {
      expandedIds: new Set(['group']),
      rankdir: 'TB'
    })
    const group = nodes.find((node) => node.id === 'group')
    const companyA = nodes.find((node) => node.id === 'company-a')

    expect(group).toBeDefined()
    expect(companyA).toBeDefined()
    expect(companyA!.position.y).toBeGreaterThan(group!.position.y)
  })

  it('places children to the right of the parent in a left-to-right layout', () => {
    const { nodes } = buildOrganizationGraph(organizationTree, {
      expandedIds: new Set(['group']),
      rankdir: 'LR'
    })
    const group = nodes.find((node) => node.id === 'group')
    const companyA = nodes.find((node) => node.id === 'company-a')

    expect(companyA!.position.x).toBeGreaterThan(group!.position.x)
  })

  it('keeps multiple roots visible without inventing a virtual parent', () => {
    const { nodes, edges } = buildOrganizationGraph(forest, { expandedIds: new Set() })

    expect(nodes.map((node) => node.id)).toEqual(['group-a', 'group-b'])
    expect(edges).toEqual([])
    expect(nodes[0]?.position.x).not.toBe(nodes[1]?.position.x)
  })
})
