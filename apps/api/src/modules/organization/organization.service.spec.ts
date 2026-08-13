import { OrganizationService } from './organization.service'

import type { BadRequestException } from '@nestjs/common'
import type { OrganizationType } from '@prisma/client'
import type { AuthContext } from '@zen/shared'
import type { AuditService } from '@/common/auth/audit.service'
import type { AuthContextService } from '@/common/auth/auth-context.service'
import type { SessionService } from '@/common/auth/session.service'
import type { OrganizationRepository, OrganizationWithRelations } from './organization.repository'

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
    _count: { users: 0, posts: 0 }
  }
}

describe('OrganizationService', () => {
  const repository = {
    findMany: jest.fn(),
    findByIdInScope: jest.fn(),
    countDescendantsByPathPrefix: jest.fn(),
    findDescendantsByPathPrefix: jest.fn(),
    updateManyPaths: jest.fn()
  } as unknown as jest.Mocked<OrganizationRepository>
  const auditService = { write: jest.fn() } as unknown as AuditService
  const authContextService = { bumpPermVer: jest.fn() } as unknown as AuthContextService
  const sessionService = { revokeAllForUser: jest.fn() } as unknown as SessionService
  const service = new OrganizationService(
    repository,
    auditService,
    authContextService,
    sessionService
  )

  beforeEach(() => {
    jest.clearAllMocks()
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
    expect(authContextService.bumpPermVer).toHaveBeenCalled()
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
})
