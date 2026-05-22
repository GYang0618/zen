import { ApiProperty } from '@nestjs/swagger'

/** 与 TransformInterceptor 包装后的成功响应公共字段 */
export class ApiSuccessResponseBaseSwaggerDto {
  @ApiProperty({ description: '业务状态码（与 HTTP 状态码一致）', example: 200 })
  code!: number

  @ApiProperty({ description: '成功提示', example: 'Success' })
  message!: string

  @ApiProperty({
    description: '请求追踪 ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    nullable: true
  })
  requestId!: string | null

  @ApiProperty({ description: '响应时间（ISO 8601）', example: '2026-05-22T08:00:00.000Z' })
  timestamp!: string
}
