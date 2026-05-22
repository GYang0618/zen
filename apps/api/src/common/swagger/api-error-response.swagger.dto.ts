import { ApiProperty } from '@nestjs/swagger'

class ApiErrorDetailSwaggerDto {
  @ApiProperty({ description: '错误类型名称', example: 'UnauthorizedException', nullable: true })
  name!: string | null

  @ApiProperty({ description: '错误消息', example: '缺少认证令牌', nullable: true })
  message!: string | null

  @ApiProperty({ description: '堆栈信息（生产环境通常为空）', nullable: true })
  stack!: string | null
}

/** 与全局 AllExceptionsFilter 返回结构对齐 */
export class ApiErrorResponseSwaggerDto {
  @ApiProperty({ description: 'HTTP 状态码', example: 401 })
  code!: number

  @ApiProperty({ description: '错误摘要', example: '缺少认证令牌' })
  message!: string

  @ApiProperty({ description: '请求路径', example: '/api/user' })
  path!: string

  @ApiProperty({
    description: '请求追踪 ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    nullable: true
  })
  requestId!: string | null

  @ApiProperty({ description: '响应时间（ISO 8601）', example: '2026-05-22T08:00:00.000Z' })
  timestamp!: string

  @ApiProperty({ type: ApiErrorDetailSwaggerDto, nullable: true })
  error!: ApiErrorDetailSwaggerDto | null

  @ApiProperty({
    description: '按字段分组的校验错误',
    example: { email: ['无效的邮箱格式'] },
    nullable: true
  })
  fieldErrors!: Record<string, string[]> | null

  @ApiProperty({ description: '顶层表单级校验错误', example: [], nullable: true, type: [String] })
  formErrors!: string[] | null
}
