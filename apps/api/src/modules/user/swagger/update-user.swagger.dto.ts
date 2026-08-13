import { ApiPropertyOptional } from '@nestjs/swagger'

/** 更新用户请求体（与 updateUserSchema 对齐，全部字段可选；不含用户名与密码） */
export class UpdateUserSwaggerDto {
  @ApiPropertyOptional({ description: '登录邮箱', example: 'zhangsan@example.com' })
  email?: string

  @ApiPropertyOptional({
    description: '显示昵称，最长 50 个字符',
    maxLength: 50,
    example: '张三'
  })
  nickname?: string | null

  @ApiPropertyOptional({ description: '真实姓名', maxLength: 50 })
  realName?: string | null

  @ApiPropertyOptional({
    description: '手机号码，最长 20 个字符',
    maxLength: 20,
    example: '13800138000'
  })
  phoneNumber?: string | null

  @ApiPropertyOptional({ description: '性别', enum: ['male', 'female', 'unknown'] })
  gender?: 'male' | 'female' | 'unknown'

  @ApiPropertyOptional({ description: '备注', maxLength: 500 })
  remark?: string | null

  @ApiPropertyOptional({ description: '头像 URL' })
  avatar?: string | null
}
