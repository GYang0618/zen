import {
  assignUserRolesResultSchema,
  createUserResultSchema,
  createUserSchema,
  getPrimaryOrganization,
  getUserDisplayName,
  replaceUserOrganizationsResultSchema,
  updateUserResultSchema,
  updateUserSchema,
  userSchema,
  usersQuerySchema
} from '@zen/shared'

describe('user V2 contracts', () => {
  it('accepts create payload with optional org and roles', () => {
    expect(
      createUserSchema.safeParse({
        username: 'zhangsan',
        email: 'zhangsan@example.com',
        password: 'SecureP@ss1',
        realName: '张三',
        gender: 'male',
        roleIds: ['role-1'],
        organizations: [{ organizationId: 'org-1', isPrimary: true, postId: 'post-1' }]
      }).success
    ).toBe(true)
  })

  it('accepts create payload without password', () => {
    expect(
      createUserSchema.safeParse({
        username: 'zhangsan',
        email: 'zhangsan@example.com',
        realName: '张三'
      }).success
    ).toBe(true)
  })

  it('rejects weak passwords on create', () => {
    expect(
      createUserSchema.safeParse({
        username: 'zhangsan',
        email: 'zhangsan@example.com',
        password: 'password'
      }).success
    ).toBe(false)
  })

  it('rejects username and password on profile update', () => {
    expect(
      updateUserSchema.safeParse({
        username: 'newname',
        password: 'SecureP@ss1'
      }).success
    ).toBe(false)
    expect(updateUserSchema.safeParse({ realName: '李四', gender: 'female' }).success).toBe(true)
  })

  it('returns only the changed user aggregate segment', () => {
    expect(
      updateUserResultSchema.parse({
        id: 'u1',
        nickname: '昵称',
        realName: '姓名',
        avatar: null,
        gender: 'unknown',
        email: 'user@example.com',
        phoneNumber: null,
        remark: null,
        updatedAt: '2026-08-19T00:00:00.000Z',
        organizations: [{ organizationId: 'ignored' }]
      })
    ).not.toHaveProperty('organizations')

    expect(
      assignUserRolesResultSchema.parse({
        id: 'u1',
        roles: [
          {
            id: 'r1',
            code: 'user',
            name: '普通用户',
            description: null,
            icon: null,
            iconColor: null,
            kind: 'system',
            status: 'active',
            permissionCount: 1
          }
        ],
        organizations: []
      })
    ).not.toHaveProperty('organizations')

    expect(
      replaceUserOrganizationsResultSchema.parse({
        id: 'u1',
        organizations: [
          {
            organizationId: 'o1',
            organizationName: '总部',
            organizationCode: 'HQ',
            organizationType: 'company',
            isPrimary: true,
            postId: null,
            postName: null,
            postLevel: null,
            joinedAt: null
          }
        ],
        roles: []
      })
    ).not.toHaveProperty('roles')
  })

  it('supports lastLoginAt sort and organization filter', () => {
    expect(
      usersQuerySchema.safeParse({
        page: 1,
        pageSize: 10,
        organizationId: 'org-1',
        sortBy: 'lastLoginAt',
        sortOrder: 'desc'
      }).success
    ).toBe(true)
    expect(
      usersQuerySchema.safeParse({
        page: 1,
        pageSize: 10,
        sortBy: 'lastActiveAt',
        sortOrder: 'desc'
      }).success
    ).toBe(true)
    expect(usersQuerySchema.safeParse({ sortBy: 'jobTitle' }).success).toBe(false)
  })

  it('derives display name and primary organization', () => {
    expect(getUserDisplayName({ username: 'a', nickname: '昵称', realName: '真名' })).toBe('真名')
    expect(getUserDisplayName({ username: 'a', nickname: '昵称', realName: null })).toBe('昵称')
    expect(
      getPrimaryOrganization([
        { id: '1', isPrimary: false },
        { id: '2', isPrimary: true }
      ])?.id
    ).toBe('2')
  })

  it('requires roles and organizations arrays on user payload', () => {
    const parsed = userSchema.safeParse({
      id: 'u1',
      username: 'zhangsan',
      nickname: '张三',
      realName: '张三',
      avatar: null,
      gender: 'unknown',
      email: 'a@b.c',
      phoneNumber: null,
      status: 'active',
      isLocked: false,
      lockExpireAt: null,
      roles: [
        {
          id: 'r1',
          code: 'user',
          name: '普通用户',
          description: null,
          icon: 'users',
          iconColor: 'slate',
          kind: 'system',
          status: 'active',
          permissionCount: 0
        }
      ],
      organizations: [],
      mfaEnabled: false,
      mfaType: 'off',
      mustChangePassword: false,
      lastPasswordChange: null,
      passwordExpireAt: null,
      loginAttempts: 0,
      lastLoginAt: null,
      lastLoginIp: null,
      lastActiveAt: null,
      activeSessionCount: 0,
      accessTokenExpiresAt: null,
      remark: null,
      createdAt: '2026-08-13T00:00:00.000Z',
      updatedAt: '2026-08-13T00:00:00.000Z'
    })
    expect(parsed.success).toBe(true)
  })

  it('returns initialPassword only on create result', () => {
    const user = {
      id: 'u1',
      username: 'zhangsan',
      nickname: '张三',
      realName: '张三',
      avatar: null,
      gender: 'unknown' as const,
      email: 'a@b.c',
      phoneNumber: null,
      status: 'active' as const,
      isLocked: false,
      lockExpireAt: null,
      roles: [],
      organizations: [],
      mfaEnabled: false,
      mfaType: 'off' as const,
      mustChangePassword: true,
      lastPasswordChange: null,
      passwordExpireAt: null,
      loginAttempts: 0,
      lastLoginAt: null,
      lastLoginIp: null,
      lastActiveAt: null,
      activeSessionCount: 0,
      accessTokenExpiresAt: null,
      remark: null,
      createdAt: '2026-08-19T00:00:00.000Z',
      updatedAt: '2026-08-19T00:00:00.000Z'
    }

    expect(createUserResultSchema.safeParse(user).success).toBe(false)
    expect(
      createUserResultSchema.safeParse({ ...user, initialPassword: 'TmpP@ssw0rd!' }).success
    ).toBe(true)
    expect(userSchema.parse(user)).not.toHaveProperty('initialPassword')
  })
})
