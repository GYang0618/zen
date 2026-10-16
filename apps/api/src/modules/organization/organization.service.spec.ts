import { OrganizationService } from './organization.service.js'

import type { BadRequestException } from '@nestjs/common'
import type { OrganizationType } from '@prisma/client'
import type { AuthContext } from '@zen/shared'
import type { AuditService } from '../../common/auth/audit.service.js'
import type { AuthContextService } from '../../common/auth/auth-context.service.js'
import type { SessionService } from '../../common/auth/session.service.js'
import type { PostService } from '../post/index.js'
import type {
  OrganizationRepository,
  OrganizationWithRelations
} from './organization.repository.js'

const { jest } = import.meta

const auth: AuthContext = {
  tenantId: 'tenant',
  userId: 'operator',
  roles: [],
  permissions: [],
  isAdmin: true,
  dataScope: 'all',
  orgIds: [],
  permVer: 1
}

function organization(input: {
  id: string
  name: string
  parentId?: string | null
  type?: OrganizationType
  memberCount?: number
  positionCount?: number
}): OrganizationWithRelations {
  return {
    id: input.id,
    code: input.id,
    name: input.name,
    type: input.type ?? 'CENTER',
    parentId: input.parentId ?? null,
    leaderId: null,
    description: null,
    effectiveDate: new Date('2026-08-13T00:00:00.000Z'),
    path: `/${input.id}/`,
    level: input.parentId ? 2 : 1,
    createdAt: new Date('2026-08-13T00:00:00.000Z'),
    updatedAt: new Date('2026-08-13T00:00:00.000Z'),
    leader: null,
    _count: { users: input.memberCount ?? 0, posts: input.positionCount ?? 0 }
  }
}

function member(userId: string) {
  return {
    user: {
      id: userId,
      username: userId,
      nickname: null,
      email: `${userId}@zen.dev`,
      phoneNumber: null,
      status: 'ACTIVE' as const,
      profile: null
    },
    post: null,
    organization: { name: '平台团队' }
  }
}

describe('OrganizationService', () => {
  const repository = {
    findMany: jest.fn(),
    findByIdInScope: jest.fn(),
    countDescendantsByPathPrefix: jest.fn(),
    findDescendantsByPathPrefix: jest.fn(),
    updateManyPaths: jest.fn(),
    findChildrenTypes: jest.fn(),
    delete: jest.fn(),
    findActiveUserById: jest.fn(),
    findUsersDisplayByIds: jest.fn(),
    findOrganizationsDisplayByIds: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    dissolve: jest.fn(),
    merge: jest.fn(),
    batchTransferMembers: jest.fn(),
    findById: jest.fn(),
    findPaged: jest.fn(),
    count: jest.fn()
  } as unknown as jest.Mocked<OrganizationRepository>
  const postService = {
    findOrganizationPosition: jest.fn()
  } as unknown as jest.Mocked<PostService>
  const auditService = { write: jest.fn() } as unknown as AuditService
  const authContextService = {
    bumpPermVer: jest.fn(),
    invalidateCache: jest.fn()
  } as unknown as AuthContextService
  const sessionService = { revokeAllForUser: jest.fn() } as unknown as SessionService
  const service = new OrganizationService(
    repository,
    postService,
    auditService,
    authContextService,
    sessionService
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('filters tree by keyword, keeping matching nodes and ancestor paths', async () => {
    repository.findMany.mockResolvedValue([
      organization({ id: 'company', name: '总公司', type: 'COMPANY' }),
      organization({ id: 'rd', name: '研发中心', parentId: 'company', type: 'CENTER' }),
      organization({ id: 'frontend', name: '前端组', parentId: 'rd', type: 'TEAM' }),
      organization({ id: 'market', name: '市场部', parentId: 'company', type: 'DEPARTMENT' })
    ])

    const tree = await service.getTree(auth, { keyword: '前端' })

    expect(tree.length).toBe(1)
    expect(tree[0]?.id).toBe('company')
    expect(tree[0]?.children.length).toBe(1)
    expect(tree[0]?.children[0]?.id).toBe('rd')
    expect(tree[0]?.children[0]?.children.length).toBe(1)
    expect(tree[0]?.children[0]?.children[0]?.id).toBe('frontend')
  })

  it('finds paged organizations matching keyword or type', async () => {
    const list = [organization({ id: 'frontend', name: '前端组', type: 'TEAM' })]
    repository.count.mockResolvedValue(1)
    repository.findPaged.mockResolvedValue(list)

    const result = await service.findAll({ keyword: '前端', page: 1, pageSize: 20 }, auth)

    expect(result.pagination.total).toBe(1)
    expect(result.items[0]?.name).toBe('前端组')
    expect(repository.findPaged).toHaveBeenCalledWith(
      expect.objectContaining({
        AND: expect.arrayContaining([
          expect.objectContaining({
            OR: [
              { name: { contains: '前端', mode: 'insensitive' } },
              { code: { contains: '前端', mode: 'insensitive' } }
            ]
          })
        ])
      }),
      { skip: 0, take: 20 }
    )
  })

  it('sorts every tree level by zh-CN name with numeric comparison', async () => {
    repository.findMany.mockResolvedValue([
      organization({ id: 'root-10', name: '研发10中心' }),
      organization({ id: 'child-10', name: '团队10', parentId: 'root-2', type: 'TEAM' }),
      organization({ id: 'root-2', name: '研发2中心' }),
      organization({ id: 'child-2', name: '团队2', parentId: 'root-2', type: 'TEAM' })
    ])

    const tree = await service.getTree(auth)

    expect(tree.map((node) => node.id)).toEqual(['root-2', 'root-10'])
    expect(tree[0]?.children.map((node) => node.id)).toEqual(['child-2', 'child-10'])
  })

  it('rejects a parent change that would not alter the hierarchy', async () => {
    repository.findByIdInScope.mockResolvedValue(
      organization({ id: 'team', name: '平台团队', parentId: 'department', type: 'TEAM' })
    )

    await expect(
      service.changeParent('team', { parentId: 'department' }, auth)
    ).rejects.toMatchObject<BadRequestException>({
      response: expect.objectContaining({ reason: 'ORG_MOVE_SAME_PARENT' })
    })
  })

  it('moves a subtree to a valid parent and invalidates authorization context', async () => {
    const source = {
      ...organization({ id: 'team', name: '平台团队', parentId: 'old-center', type: 'TEAM' }),
      path: '/old-center/team/'
    }
    const target = {
      ...organization({ id: 'new-center', name: '新中心', type: 'CENTER' }),
      path: '/new-center/'
    }
    const moved = { ...source, parentId: target.id, path: '/new-center/team/' }
    repository.findByIdInScope
      .mockResolvedValueOnce(source)
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(moved)
    repository.countDescendantsByPathPrefix.mockResolvedValue(1)
    repository.findDescendantsByPathPrefix.mockResolvedValue([
      { id: source.id, path: source.path, level: source.level }
    ])
    repository.findOrganizationsDisplayByIds.mockResolvedValue([
      { id: 'old-center', name: '旧中心', code: 'old-center' },
      { id: target.id, name: target.name, code: target.id }
    ] as never)
    repository.updateManyPaths.mockResolvedValue([])

    await service.changeParent(source.id, { parentId: target.id }, auth)

    expect(repository.updateManyPaths).toHaveBeenCalledWith([
      {
        id: source.id,
        parentId: target.id,
        path: '/new-center/team/',
        level: 2
      }
    ])
    expect(authContextService.bumpPermVer).not.toHaveBeenCalled()
    expect(authContextService.invalidateCache).toHaveBeenCalledWith()
  })

  it('deletes an empty leaf organization and records the change', async () => {
    const target = organization({ id: 'team', name: '平台团队', type: 'TEAM' })
    repository.findByIdInScope.mockResolvedValue(target)
    repository.findChildrenTypes.mockResolvedValue([])

    await service.remove(target.id, auth)

    expect(repository.delete).toHaveBeenCalledWith(target.id)
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.deleted',
        diff: expect.objectContaining({ summary: '删除了组织「平台团队」' })
      })
    )
    expect(authContextService.invalidateCache).toHaveBeenCalledWith()
  })

  it('rejects deleting an organization with children', async () => {
    repository.findByIdInScope.mockResolvedValue(organization({ id: 'center', name: '研发中心' }))
    repository.findChildrenTypes.mockResolvedValue([{ id: 'team', type: 'TEAM' }] as never)

    await expect(service.remove('center', auth)).rejects.toThrow('请先删除或迁移下级组织')

    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('rejects deleting an organization with members or positions', async () => {
    repository.findByIdInScope
      .mockResolvedValueOnce(organization({ id: 'team', name: '平台团队', memberCount: 1 }))
      .mockResolvedValueOnce(organization({ id: 'team', name: '平台团队', positionCount: 1 }))
    repository.findChildrenTypes.mockResolvedValue([])

    await expect(service.remove('team', auth)).rejects.toThrow('请先移除当前组织成员')
    await expect(service.remove('team', auth)).rejects.toThrow('请先解除当前组织岗位')

    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('scopes an added member to the affected user without bumping tenant permVer', async () => {
    repository.findByIdInScope.mockResolvedValue(organization({ id: 'team', name: '平台团队' }))
    repository.findActiveUserById.mockResolvedValue({ id: 'member' } as never)
    repository.findUsersDisplayByIds.mockResolvedValue([
      { id: 'member', username: 'member', nickname: '成员甲', profile: null }
    ] as never)
    repository.addMember.mockResolvedValue(member('member'))

    await service.addMember('team', { userIds: ['member'] }, auth)

    expect(authContextService.bumpPermVer).not.toHaveBeenCalled()
    expect(authContextService.invalidateCache).toHaveBeenCalledWith('member')
    expect(sessionService.revokeAllForUser).toHaveBeenCalledWith('member')
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.member_added',
        diff: expect.objectContaining({
          members: { added: [{ id: 'member', name: '成员甲' }] }
        })
      })
    )
  })

  it('scopes a removed member to the affected user without bumping tenant permVer', async () => {
    repository.findByIdInScope.mockResolvedValue(organization({ id: 'team', name: '平台团队' }))
    repository.findUsersDisplayByIds.mockResolvedValue([
      { id: 'member', username: 'member', nickname: '成员甲', profile: null }
    ] as never)
    repository.removeMember.mockResolvedValue({ count: 1 })

    await service.removeMember('team', 'member', auth)

    expect(authContextService.bumpPermVer).not.toHaveBeenCalled()
    expect(authContextService.invalidateCache).toHaveBeenCalledWith('member')
    expect(sessionService.revokeAllForUser).toHaveBeenCalledWith('member')
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.member_removed',
        diff: expect.objectContaining({
          members: { removed: [{ id: 'member', name: '成员甲' }] }
        })
      })
    )
  })

  it('leaves authorization untouched when the member to remove does not exist', async () => {
    repository.findByIdInScope.mockResolvedValue(organization({ id: 'team', name: '平台团队' }))
    repository.removeMember.mockResolvedValue({ count: 0 })

    await expect(service.removeMember('team', 'ghost', auth)).rejects.toThrow('组织成员不存在')

    expect(authContextService.invalidateCache).not.toHaveBeenCalled()
    expect(sessionService.revokeAllForUser).not.toHaveBeenCalled()
  })

  it('rejects moving a subtree that contains out-of-scope organizations', async () => {
    repository.findByIdInScope.mockResolvedValue(
      organization({ id: 'center', name: '中心', parentId: 'company', type: 'CENTER' })
    )
    repository.countDescendantsByPathPrefix.mockResolvedValueOnce(2).mockResolvedValueOnce(1)

    await expect(
      service.changeParent('center', { parentId: 'branch' }, auth)
    ).rejects.toMatchObject({
      response: expect.objectContaining({ reason: 'ORG_MOVE_OUT_OF_SCOPE' })
    })
  })

  it('dissolves organization, transfers children, and invalidates cache', async () => {
    repository.findByIdInScope.mockResolvedValue(
      organization({ id: 'dept-1', name: '测试部门', memberCount: 5, parentId: 'parent-1' })
    )
    repository.findById.mockResolvedValue(organization({ id: 'parent-1', name: '总经办' }))
    repository.findUsersDisplayByIds.mockResolvedValue([
      { id: 'user-1', username: 'user1', nickname: '张三', profile: null }
    ] as never)
    repository.dissolve.mockResolvedValue({
      deletedDescendants: [],
      affectedUserIds: ['user-1'],
      directChildren: [{ id: 'child-1', code: 'C1', name: '子部门1' }]
    })

    await service.dissolve('dept-1', { targetOrganizationId: null, transferChildren: true }, auth)

    expect(repository.dissolve).toHaveBeenCalledWith('dept-1', null, true, undefined)
    expect(authContextService.invalidateCache).toHaveBeenCalled()
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.dissolved',
        resourceId: 'dept-1'
      })
    )
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.parent_changed',
        resourceId: 'child-1'
      })
    )
  })

  it('dissolves organization with cascade deletion of children and writes audit for each descendant', async () => {
    repository.findByIdInScope.mockImplementation((id: string) => {
      if (id === 'dept-root')
        return Promise.resolve(organization({ id: 'dept-root', name: '根研发中心' }))
      if (id === 'dept-dest')
        return Promise.resolve(organization({ id: 'dept-dest', name: '目的地部门' }))
      return Promise.resolve(null)
    })
    repository.findUsersDisplayByIds.mockResolvedValue([
      { id: 'u1', username: 'u1', nickname: '李四', profile: null }
    ] as never)
    repository.dissolve.mockResolvedValue({
      deletedDescendants: [
        { id: 'sub-1', code: 'S1', name: '子团队A', parentId: 'dept-root' },
        { id: 'sub-2', code: 'S2', name: '孙团队B', parentId: 'sub-1' }
      ],
      affectedUserIds: ['u1'],
      directChildren: [{ id: 'sub-1', code: 'S1', name: '子团队A' }]
    })

    await service.dissolve(
      'dept-root',
      { targetOrganizationId: 'dept-dest', transferChildren: false },
      auth
    )

    // 每个子孙部门都记录了独立删除审计
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.deleted',
        resourceId: 'sub-1'
      })
    )
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.deleted',
        resourceId: 'sub-2'
      })
    )
    // 根组织记录了 dissolved 审计
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.dissolved',
        resourceId: 'dept-root'
      })
    )
    // 目标组织记录了调入审计
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.member_transferred_in',
        resourceId: 'dept-dest'
      })
    )
  })

  it('dissolves organization with targetChildrenOrganizationId', async () => {
    repository.findByIdInScope.mockImplementation((id: string) => {
      if (id === 'dept-1') {
        return Promise.resolve(organization({ id: 'dept-1', path: '/group/dept-1/' }))
      }
      if (id === 'dept-2') {
        return Promise.resolve(organization({ id: 'dept-2', path: '/group/dept-2/' }))
      }
      return Promise.resolve(null)
    })
    repository.findUsersDisplayByIds.mockResolvedValue([])
    repository.dissolve.mockResolvedValue({
      deletedDescendants: [],
      affectedUserIds: [],
      directChildren: []
    })

    await service.dissolve(
      'dept-1',
      {
        targetOrganizationId: 'dept-2',
        transferChildren: true,
        targetChildrenOrganizationId: 'dept-2'
      },
      auth
    )

    expect(repository.dissolve).toHaveBeenCalledWith('dept-1', 'dept-2', true, 'dept-2')
  })

  it('merges organization into target, recording dual-side audit and parent changes', async () => {
    repository.findByIdInScope
      .mockResolvedValueOnce(organization({ id: 'dept-source', name: '源部门' }))
      .mockResolvedValueOnce(organization({ id: 'dept-target', name: '目标部门' }))
    repository.findUsersDisplayByIds.mockResolvedValue([
      { id: 'user-a', username: 'usera', nickname: '王五', profile: null }
    ] as never)
    repository.merge.mockResolvedValue({
      directChildren: [{ id: 'child-x', code: 'CX', name: '下属子组' }],
      transferredUserIds: ['user-a']
    })

    await service.merge('dept-source', { targetOrganizationId: 'dept-target' }, auth)

    expect(repository.merge).toHaveBeenCalledWith('dept-source', 'dept-target')
    expect(authContextService.invalidateCache).toHaveBeenCalled()
    // 源组织审计
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.merged',
        resourceId: 'dept-source'
      })
    )
    // 目标组织审计
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.merged_in',
        resourceId: 'dept-target'
      })
    )
    // 直属子部门父级变更审计
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.parent_changed',
        resourceId: 'child-x'
      })
    )
  })

  it('batch transfers members between organizations and records dual audit logs', async () => {
    repository.findByIdInScope
      .mockResolvedValueOnce(organization({ id: 'org-src', name: '源部门' }))
      .mockResolvedValueOnce(organization({ id: 'org-dst', name: '目标部门' }))
    postService.findOrganizationPosition.mockResolvedValue({
      id: 'pos-1',
      jobProfile: { name: '资深前端工程师' }
    } as never)
    repository.findUsersDisplayByIds.mockResolvedValue([
      { id: 'u1', username: 'u1', nickname: '人员1', profile: null },
      { id: 'u2', username: 'u2', nickname: '人员2', profile: null }
    ] as never)
    repository.batchTransferMembers.mockResolvedValue([] as never)

    await service.batchTransferMembers(
      'org-src',
      {
        userIds: ['u1', 'u2'],
        targetOrganizationId: 'org-dst',
        targetPostId: 'pos-1'
      },
      auth
    )

    expect(repository.batchTransferMembers).toHaveBeenCalledWith(['u1', 'u2'], 'org-dst', 'pos-1')
    // 源组织审计：调出
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.member_transferred_out',
        resourceId: 'org-src'
      })
    )
    // 目标组织审计：调入
    expect(auditService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.organization.member_transferred_in',
        resourceId: 'org-dst'
      })
    )
  })
})
