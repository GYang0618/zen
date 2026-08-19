import { ApiProperty } from '@nestjs/swagger'

import { ApiSuccessResponseBaseSwaggerDto } from '@/common/swagger'

import { UserStatusSwagger } from './user-status.swagger'

/** 用户列表行（与 userSchema / UserListItemResponse 对齐） */
export class UserListItemSwaggerDto {
  @ApiProperty({ description: '用户 ID', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string

  @ApiProperty({ description: '用户名', example: 'zhangsan' })
  username!: string

  @ApiProperty({ description: '昵称', example: '张三', nullable: true })
  nickname!: string | null

  @ApiProperty({ description: '真实姓名', nullable: true })
  realName!: string | null

  @ApiProperty({ description: '头像 URL', nullable: true })
  avatar!: string | null

  @ApiProperty({ description: '邮箱', example: 'zhangsan@example.com' })
  email!: string

  @ApiProperty({ description: '手机号', example: '13800138000', nullable: true })
  phoneNumber!: string | null

  @ApiProperty({
    description: '账号状态',
    enum: UserStatusSwagger,
    example: UserStatusSwagger.ACTIVE
  })
  status!: UserStatusSwagger

  @ApiProperty({ description: '是否锁定' })
  isLocked!: boolean

  @ApiProperty({ description: '锁定到期时间（ISO 8601）', nullable: true })
  lockExpireAt!: string | null

  @ApiProperty({ description: '已绑定角色', type: 'array' })
  roles!: Array<{
    id: string
    code: string
    name: string
    icon: string | null
    iconColor: string | null
    kind: 'system' | 'custom'
    status: 'active' | 'disabled'
  }>

  @ApiProperty({ description: '在职组织归属', type: 'array' })
  organizations!: Array<{
    organizationId: string
    organizationName: string
    organizationCode: string
    organizationType: string
    isPrimary: boolean
    postId: string | null
    postName: string | null
    postLevel: string | null
    joinedAt: string | null
  }>

  @ApiProperty({ description: '是否启用 MFA' })
  mfaEnabled!: boolean

  @ApiProperty({ description: '最近登录时间（ISO 8601）', nullable: true })
  lastLoginAt!: string | null

  @ApiProperty({ description: '备注', nullable: true })
  remark!: string | null

  @ApiProperty({ description: '创建时间（ISO 8601）', example: '2026-05-22T08:00:00.000Z' })
  createdAt!: string

  @ApiProperty({ description: '更新时间（ISO 8601）', example: '2026-05-22T08:00:00.000Z' })
  updatedAt!: string
}

class PageMetaSwaggerDto {
  @ApiProperty({ description: '总记录数', example: 42 })
  total!: number

  @ApiProperty({ description: '总页数', example: 5 })
  totalPages!: number

  @ApiProperty({ description: '当前页码', example: 1 })
  page!: number

  @ApiProperty({ description: '每页数量', example: 10 })
  pageSize!: number
}

/** 分页用户列表 data 载荷 */
export class UserListDataSwaggerDto {
  @ApiProperty({ type: [UserListItemSwaggerDto] })
  items!: UserListItemSwaggerDto[]

  @ApiProperty({ type: PageMetaSwaggerDto })
  pagination!: PageMetaSwaggerDto
}

class UserProfileSwaggerDto {
  @ApiProperty({ example: 'zhangsan' })
  username!: string

  @ApiProperty({ nullable: true, example: '张三' })
  nickname!: string | null

  @ApiProperty({ description: '真实姓名', nullable: true })
  realName!: string | null

  @ApiProperty({ description: '头像 URL', nullable: true })
  avatar!: string | null

  @ApiProperty({
    description: '性别',
    enum: ['male', 'female', 'unknown'],
    nullable: true,
    example: 'unknown'
  })
  gender!: 'male' | 'female' | 'unknown' | null
}

class UserContactSwaggerDto {
  @ApiProperty({ example: 'zhangsan@example.com' })
  email!: string

  @ApiProperty({ nullable: true, example: '13800138000' })
  phoneNumber!: string | null
}

class RoleInfoSwaggerDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d480' })
  id!: string

  @ApiProperty({ example: 'admin' })
  code!: string

  @ApiProperty({ example: '管理员' })
  name!: string

  @ApiProperty({ nullable: true })
  description!: string | null

  @ApiProperty({ type: [String], example: ['user:read', 'user:write'] })
  permissions!: string[]

  @ApiProperty({ example: true })
  isSystem!: boolean

  @ApiProperty({ enum: ['active', 'disabled'], example: 'active' })
  status!: 'active' | 'disabled'

  @ApiProperty({ nullable: true })
  sort!: number | null

  @ApiProperty({ nullable: true })
  createdAt!: string | null

  @ApiProperty({ nullable: true })
  updatedAt!: string | null
}

class UserAuthSwaggerDto {
  @ApiProperty({ type: [String], example: ['admin'] })
  roles!: string[]

  @ApiProperty({ type: [String], example: ['user:read'] })
  permissions!: string[]

  @ApiProperty({ type: [RoleInfoSwaggerDto] })
  roleDetails!: RoleInfoSwaggerDto[]
}

class UserOrgSwaggerDto {
  @ApiProperty({ nullable: true })
  deptId!: string | null

  @ApiProperty({ nullable: true })
  deptName!: string | null

  @ApiProperty({ nullable: true })
  jobTitle!: string | null
}

class UserAccountSwaggerDto {
  @ApiProperty({ enum: UserStatusSwagger })
  status!: UserStatusSwagger

  @ApiProperty({ description: '邮箱是否已验证' })
  isVerified!: boolean

  @ApiProperty({ description: '是否锁定' })
  isLocked!: boolean

  @ApiProperty({ nullable: true })
  lockReason!: string | null

  @ApiProperty({ nullable: true })
  lockExpireAt!: string | null
}

class UserSecuritySwaggerDto {
  @ApiProperty()
  mfaEnabled!: boolean

  @ApiProperty({
    enum: ['totp', 'sms', 'email', 'off'],
    nullable: true,
    example: 'off'
  })
  mfaType!: 'totp' | 'sms' | 'email' | 'off' | null

  @ApiProperty({ nullable: true })
  passwordExpireAt!: string | null

  @ApiProperty({ nullable: true })
  lastPasswordChange!: string | null

  @ApiProperty({ nullable: true })
  loginAttempts!: number | null
}

class UserNotificationsSwaggerDto {
  @ApiProperty()
  email!: boolean

  @ApiProperty()
  push!: boolean

  @ApiProperty()
  sms!: boolean
}

class UserDashboardSwaggerDto {
  @ApiProperty({ nullable: true })
  defaultView!: string | null

  @ApiProperty({ type: [String], nullable: true })
  widgets!: string[] | null
}

class UserPreferencesSwaggerDto {
  @ApiProperty({ example: 'zh-CN' })
  locale!: string

  @ApiProperty({ example: 'Asia/Shanghai' })
  timezone!: string

  @ApiProperty({ enum: ['light', 'dark', 'system'], example: 'system' })
  theme!: 'light' | 'dark' | 'system'

  @ApiProperty({ type: UserNotificationsSwaggerDto })
  notifications!: UserNotificationsSwaggerDto

  @ApiProperty({ type: UserDashboardSwaggerDto, nullable: true })
  dashboard!: UserDashboardSwaggerDto | null
}

class UserAuditSwaggerDto {
  @ApiProperty()
  createdAt!: string

  @ApiProperty({ nullable: true })
  createdBy!: string | null

  @ApiProperty()
  updatedAt!: string

  @ApiProperty({ nullable: true })
  updatedBy!: string | null

  @ApiProperty({ nullable: true })
  lastLoginAt!: string | null

  @ApiProperty({ nullable: true })
  lastLoginIp!: string | null

  @ApiProperty({ nullable: true })
  lastActiveAt!: string | null
}

/** 用户详情（与 UserInfoResponse 对齐） */
export class UserInfoSwaggerDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string

  @ApiProperty({ type: UserProfileSwaggerDto })
  profile!: UserProfileSwaggerDto

  @ApiProperty({ type: UserContactSwaggerDto })
  contact!: UserContactSwaggerDto

  @ApiProperty({ type: UserAuthSwaggerDto })
  auth!: UserAuthSwaggerDto

  @ApiProperty({ type: UserOrgSwaggerDto })
  org!: UserOrgSwaggerDto

  @ApiProperty({ type: UserAccountSwaggerDto })
  account!: UserAccountSwaggerDto

  @ApiProperty({ type: UserSecuritySwaggerDto })
  security!: UserSecuritySwaggerDto

  @ApiProperty({ type: UserPreferencesSwaggerDto })
  preferences!: UserPreferencesSwaggerDto

  @ApiProperty({ type: UserAuditSwaggerDto })
  audit!: UserAuditSwaggerDto

  @ApiProperty({ nullable: true })
  remark!: string | null

  @ApiProperty({
    description: '扩展元数据',
    nullable: true,
    type: 'object',
    additionalProperties: true
  })
  meta!: Record<string, unknown> | null
}

export class CreateUserSuccessSwaggerDto extends ApiSuccessResponseBaseSwaggerDto {
  @ApiProperty({ example: 200 })
  declare code: number

  @ApiProperty({ type: UserListItemSwaggerDto })
  data!: UserListItemSwaggerDto
}

export class UserListSuccessSwaggerDto extends ApiSuccessResponseBaseSwaggerDto {
  @ApiProperty({ type: UserListDataSwaggerDto })
  data!: UserListDataSwaggerDto
}

export class UserInfoSuccessSwaggerDto extends ApiSuccessResponseBaseSwaggerDto {
  @ApiProperty({ type: UserInfoSwaggerDto })
  data!: UserInfoSwaggerDto
}

export class UserListItemArraySuccessSwaggerDto extends ApiSuccessResponseBaseSwaggerDto {
  @ApiProperty({ type: [UserListItemSwaggerDto] })
  data!: UserListItemSwaggerDto[]
}

export class UpdateUserSuccessSwaggerDto extends ApiSuccessResponseBaseSwaggerDto {
  @ApiProperty({ type: UserListItemSwaggerDto })
  data!: UserListItemSwaggerDto
}

class UpdateUserResultSwaggerDto {
  @ApiProperty({ description: '用户 ID' })
  id!: string

  @ApiProperty({ nullable: true })
  nickname!: string | null

  @ApiProperty({ nullable: true })
  realName!: string | null

  @ApiProperty({ nullable: true })
  avatar!: string | null

  @ApiProperty({ enum: ['male', 'female', 'unknown'] })
  gender!: 'male' | 'female' | 'unknown'

  @ApiProperty()
  email!: string

  @ApiProperty({ nullable: true })
  phoneNumber!: string | null

  @ApiProperty({ nullable: true })
  remark!: string | null

  @ApiProperty({ description: '更新时间（ISO 8601）' })
  updatedAt!: string
}

class AssignUserRolesResultSwaggerDto {
  @ApiProperty({ description: '用户 ID' })
  id!: string

  @ApiProperty({ description: '更新后的角色预览', type: 'array' })
  roles!: UserListItemSwaggerDto['roles']
}

class ReplaceUserOrganizationsResultSwaggerDto {
  @ApiProperty({ description: '用户 ID' })
  id!: string

  @ApiProperty({ description: '更新后的组织归属', type: 'array' })
  organizations!: UserListItemSwaggerDto['organizations']
}

export class UpdateUserPartialSuccessSwaggerDto extends ApiSuccessResponseBaseSwaggerDto {
  @ApiProperty({ type: UpdateUserResultSwaggerDto })
  data!: UpdateUserResultSwaggerDto
}

export class AssignUserRolesSuccessSwaggerDto extends ApiSuccessResponseBaseSwaggerDto {
  @ApiProperty({ type: AssignUserRolesResultSwaggerDto })
  data!: AssignUserRolesResultSwaggerDto
}

export class ReplaceUserOrganizationsSuccessSwaggerDto extends ApiSuccessResponseBaseSwaggerDto {
  @ApiProperty({ type: ReplaceUserOrganizationsResultSwaggerDto })
  data!: ReplaceUserOrganizationsResultSwaggerDto
}
