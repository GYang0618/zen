import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/** 创建用户请求体（与 createUserSchema 对齐，仅用于 OpenAPI 文档） */
export class CreateUserSwaggerDto {
  @ApiProperty({
    description: '登录用户名，3–30 个字符',
    minLength: 3,
    maxLength: 30,
    example: 'zhangsan'
  })
  username!: string

  @ApiProperty({ description: '登录邮箱', example: 'zhangsan@example.com' })
  email!: string

  @ApiProperty({
    description: '登录密码：至少 8 位，且包含大写、小写、数字与特殊字符',
    minLength: 8,
    example: 'SecureP@ss1'
  })
  password!: string

  @ApiPropertyOptional({
    description: '显示昵称，最长 50 个字符',
    maxLength: 50,
    example: '张三'
  })
  nickname?: string

  @ApiPropertyOptional({
    description: '手机号码，最长 20 个字符',
    maxLength: 20,
    example: '13800138000'
  })
  phoneNumber?: string
}
