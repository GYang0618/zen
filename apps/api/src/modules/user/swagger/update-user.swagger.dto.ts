import { ApiPropertyOptional } from '@nestjs/swagger'

/** 更新用户请求体（与 updateUserSchema 对齐，全部字段可选） */
export class UpdateUserSwaggerDto {
  @ApiPropertyOptional({
    description: '登录用户名，3–30 个字符',
    minLength: 3,
    maxLength: 30,
    example: 'zhangsan'
  })
  username?: string

  @ApiPropertyOptional({ description: '登录邮箱', example: 'zhangsan@example.com' })
  email?: string

  @ApiPropertyOptional({
    description: '新密码：至少 8 位，且包含大写、小写、数字与特殊字符',
    minLength: 8,
    example: 'NewSecureP@ss1'
  })
  password?: string

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
