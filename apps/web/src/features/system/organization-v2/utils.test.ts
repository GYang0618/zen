import { describe, expect, it } from 'vitest'

import { moveOrganizationInTree, validateOrganizationDrop } from './utils'

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
    updatedAt: '2026-01-01T00:00:00.000Z',
    children
  }
}

const organizationTree = [
  organization('group', 'group', null, [
    organization('company-a', 'company', 'group', [
      organization('branch-a', 'branch', 'company-a', [
        organization('department-a', 'department', 'branch-a', [
          organization('team-a', 'team', 'department-a')
        ])
      ])
    ]),
    organization('company-b', 'company', 'group', [organization('center-b', 'center', 'company-b')])
  ])
]

const multiRootOrganizationTree = [
  organization('group-a', 'group', null, [organization('company-a', 'company', 'group-a')]),
  organization('group-b', 'group', null, [organization('company-b', 'company', 'group-b')])
]

describe('validateOrganizationDrop', () => {
  it('拒绝将根组织拖到自身的下级组织，以及拖到自身', () => {
    expect(validateOrganizationDrop(organizationTree, 'group', 'company-a')).toMatchObject({
      isValid: false,
      reason: 'own-descendant'
    })
    expect(validateOrganizationDrop(organizationTree, 'company-a', 'company-a')).toMatchObject({
      isValid: false,
      reason: 'same-organization'
    })
  })

  it('拒绝同级重排：拖到兄弟节点无效，仅允许挂到目标下成为子节点', () => {
    expect(validateOrganizationDrop(multiRootOrganizationTree, 'group-a', 'group-b')).toMatchObject({
      isValid: false,
      reason: 'incompatible-hierarchy'
    })
  })

  it('已在目标下时拒绝', () => {
    expect(validateOrganizationDrop(organizationTree, 'company-a', 'group')).toMatchObject({
      isValid: false,
      reason: 'same-parent'
    })
  })

  it('根组织不能挂到其他组织下成为子节点', () => {
    expect(validateOrganizationDrop(multiRootOrganizationTree, 'group-a', 'company-b')).toMatchObject(
      {
        isValid: false,
        reason: 'incompatible-hierarchy'
      }
    )
  })

  it('拒绝将组织拖到自身的下级组织', () => {
    expect(validateOrganizationDrop(organizationTree, 'branch-a', 'department-a')).toMatchObject({
      isValid: false,
      reason: 'own-descendant'
    })
  })

  it('拒绝高层级组织拖到不兼容的低层级组织', () => {
    expect(validateOrganizationDrop(organizationTree, 'company-b', 'department-a')).toMatchObject({
      isValid: false,
      reason: 'incompatible-hierarchy'
    })
  })

  it('允许拖到兼容的直接上级并返回目标父节点', () => {
    expect(validateOrganizationDrop(organizationTree, 'team-a', 'center-b')).toEqual({
      isValid: true,
      action: 'reparent-as-child',
      destinationParentId: 'center-b'
    })
  })

  it('仅在校验成功时修改树结构', () => {
    const nextTree = moveOrganizationInTree(organizationTree, 'team-a', 'center-b')

    expect(nextTree?.[0]?.children?.[1]?.children?.[0]?.children?.[0]?.id).toBe('team-a')
    expect(moveOrganizationInTree(organizationTree, 'company-b', 'department-a')).toBeNull()
  })
})
