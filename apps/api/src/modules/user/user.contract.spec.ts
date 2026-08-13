import {
  createUserSchema,
  getPrimaryOrganization,
  getUserDisplayName,
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
          icon: 'users',
          iconColor: 'slate',
          kind: 'system',
          status: 'active'
        }
      ],
      organizations: [],
      mfaEnabled: false,
      mfaType: 'off',
      mustChangePassword: false,
      lastPasswordChange: null,
      loginAttempts: 0,
      lastLoginAt: null,
      lastLoginIp: null,
      lastActiveAt: null,
      remark: null,
      createdAt: '2026-08-13T00:00:00.000Z',
      updatedAt: '2026-08-13T00:00:00.000Z'
    })
    expect(parsed.success).toBe(true)
  })
})
