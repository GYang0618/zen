import { describe, expect, it } from 'vitest'

import { moveOrganizationInTree, validateOrganizationDrop } from './utils'

import type { Organization } from './type'

function organization(
  id: string,
  type: string,
  parentId?: string,
  children?: Organization[]
): Organization {
  return {
    id,
    name: id,
    code: id,
    type,
    description: '',
    effectiveDate: '2026-01-01',
    memberCount: 0,
    positionCount: 0,
    budget: 0,
    parentId,
    children
  }
}

const organizationTree = [
  organization('group', 'GROUP', undefined, [
    organization('company-a', 'COMPANY', 'group', [
      organization('branch-a', 'BRANCH', 'company-a', [
        organization('department-a', 'DEPARTMENT', 'branch-a', [
          organization('team-a', 'TEAM', 'department-a')
        ])
      ])
    ]),
    organization('company-b', 'COMPANY', 'group', [organization('center-b', 'CENTER', 'company-b')])
  ])
]

/** 顶层存在多个根组织（如多个集团）的场景 */
const multiRootOrganizationTree = [
  organization('group-a', 'GROUP', undefined, [organization('company-a', 'COMPANY', 'group-a')]),
  organization('group-b', 'GROUP', undefined, [organization('company-b', 'COMPANY', 'group-b')])
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

  it('单一根组织没有同级可调整顺序，拖到不兼容层级会被拒绝', () => {
    expect(validateOrganizationDrop(organizationTree, 'group', 'company-b')).toMatchObject({
      isValid: false,
      reason: 'own-descendant'
    })
  })

  it('允许调整多个根组织（如多个集团）之间的顺序', () => {
    expect(validateOrganizationDrop(multiRootOrganizationTree, 'group-a', 'group-b')).toEqual({
      isValid: true,
      action: 'reorder-siblings',
      destinationParentId: undefined
    })

    const nextTree = moveOrganizationInTree(multiRootOrganizationTree, 'group-a', 'group-b')
    expect(nextTree?.map((node) => node.id)).toEqual(['group-b', 'group-a'])
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
