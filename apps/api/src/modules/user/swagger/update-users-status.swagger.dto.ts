import { ApiProperty } from '@nestjs/swagger'

import { UserStatusSwagger } from './user-status.swagger'

/** 批量更新用户状态请求体（与 updateUsersStatusSchema 对齐） */
export class UpdateUsersStatusSwaggerDto {
  @ApiProperty({
    description: '要更新状态的用户 ID 列表，至少 1 个',
    type: [String],
    minItems: 1,
    example: ['f47ac10b-58cc-4372-a567-0e02b2c3d479']
  })
  ids!: string[]

  @ApiProperty({
    description:
      '目标账号状态。管理员禁用/停用/封禁账户请使用 suspended；inactive 仅表示账号未完成激活',
    enum: UserStatusSwagger,
    example: UserStatusSwagger.SUSPENDED
  })
  status!: UserStatusSwagger
}
