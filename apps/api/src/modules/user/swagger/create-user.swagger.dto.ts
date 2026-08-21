import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/** 创建用户请求体（与 createUserSchema 对齐，仅用于 OpenAPI 文档） */
export class CreateUserSwaggerDto {
  @ApiProperty({
    description: '登录用户名，3–30 个字符，创建后不可修改',
    minLength: 3,
    maxLength: 30,
    example: 'zhangsan'
  })
  username!: string

  @ApiProperty({ description: '登录邮箱', example: 'zhangsan@example.com' })
  email!: string

  @ApiPropertyOptional({
    description:
      '可选登录密码。省略时由服务端生成临时密码，仅在创建响应中返回一次，并要求首次登录或邀请链接设密',
    minLength: 8,
    example: 'SecureP@ss1'
  })
  password?: string

  @ApiPropertyOptional({
    description: '显示昵称，最长 50 个字符',
    maxLength: 50,
    example: '张三'
  })
  nickname?: string

  @ApiPropertyOptional({ description: '真实姓名', maxLength: 50, example: '张三' })
  realName?: string

  @ApiPropertyOptional({
    description: '手机号码，最长 20 个字符',
    maxLength: 20,
    example: '13800138000'
  })
  phoneNumber?: string

  @ApiPropertyOptional({ description: '性别', enum: ['male', 'female', 'unknown'] })
  gender?: 'male' | 'female' | 'unknown'

  @ApiPropertyOptional({ description: '备注', maxLength: 500 })
  remark?: string

  @ApiPropertyOptional({
    description: '初始角色 ID 列表；省略时分配默认 user 角色',
    type: [String]
  })
  roleIds?: string[]

  @ApiPropertyOptional({
    description: '初始组织归属',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        isPrimary: { type: 'boolean' },
        postId: { type: 'string', nullable: true }
      }
    }
  })
  organizations?: Array<{ organizationId: string; isPrimary?: boolean; postId?: string | null }>
}
