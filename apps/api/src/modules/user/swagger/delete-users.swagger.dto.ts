import { ApiProperty } from '@nestjs/swagger'

/** 批量删除 / 恢复用户请求体（与 deleteUsersSchema 对齐） */
export class DeleteUsersSwaggerDto {
  @ApiProperty({
    description: '要操作的用户 ID 列表，至少 1 个',
    type: [String],
    minItems: 1,
    example: ['f47ac10b-58cc-4372-a567-0e02b2c3d479']
  })
  ids!: string[]
}
