import {
  applyDataScope,
  applyFileDataScope,
  applyOrganizationTreeDataScope,
  applyUserListDataScope
} from '@zen/plugin-sdk'

import type { AuthContext } from '@zen/shared'

function baseAuth(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    tenantId: 't1',
    userId: 'u1',
    roles: ['user'],
    permissions: [],
    isAdmin: false,
    dataScope: 'self',
    orgIds: ['org1'],
    primaryOrgId: 'org1',
    primaryOrgPath: '/t1/org1/',
    permVer: 1,
    ...overrides
  }
}

describe('applyDataScope (re-export)', () => {
  it('SELF 仅本人', () => {
    expect(applyDataScope(baseAuth({ dataScope: 'self' }))).toEqual({ createdBy: 'u1' })
  })

  it('ORG_AND_CHILD 使用 path 前缀', () => {
    expect(applyDataScope(baseAuth({ dataScope: 'org_and_child' }))).toEqual({
      organizationPath: { startsWith: '/t1/org1/' }
    })
  })
})

describe('applyUserListDataScope', () => {
  it('SELF 仅本人', () => {
    expect(applyUserListDataScope(baseAuth({ dataScope: 'self' }))).toEqual({ id: 'u1' })
  })
})

describe('applyOrganizationTreeDataScope', () => {
  it('ORG 按 id 列表', () => {
    expect(applyOrganizationTreeDataScope(baseAuth({ dataScope: 'org' }))).toEqual({
      id: { in: ['org1'] }
    })
  })
})

describe('applyFileDataScope', () => {
  it('管理员或 all 不限制', () => {
    expect(applyFileDataScope(baseAuth({ isAdmin: true }))).toEqual({})
    expect(applyFileDataScope(baseAuth({ dataScope: 'all' }))).toEqual({})
  })

  it('SELF 仅本人文件', () => {
    expect(applyFileDataScope(baseAuth({ dataScope: 'self' }))).toEqual({ ownerId: 'u1' })
  })

  it('ORG 为自己或本组织文件', () => {
    expect(applyFileDataScope(baseAuth({ dataScope: 'org' }))).toEqual({
      OR: [{ ownerId: 'u1' }, { organizationId: { in: ['org1'] } }]
    })
  })

  it('ORG_AND_CHILD 为自己或下级组织文件', () => {
    expect(applyFileDataScope(baseAuth({ dataScope: 'org_and_child' }))).toEqual({
      OR: [{ ownerId: 'u1' }, { organization: { path: { startsWith: '/t1/org1/' } } }]
    })
  })
})
