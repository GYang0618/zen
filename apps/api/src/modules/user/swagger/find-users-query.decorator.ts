import { applyDecorators } from '@nestjs/common'
import { ApiQuery } from '@nestjs/swagger'

import {
  UserStatusSwagger,
  UsersSortBySwagger,
  UsersSortOrderSwagger
} from './user-status.swagger.js'

const userStatusEnum = Object.values(UserStatusSwagger)

/** 为 GET /user 列表接口生成查询参数 OpenAPI 描述（与 usersQuerySchema 对齐） */
export function ApiFindUsersQueryDocs() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: '页码，可选；只传 pageSize 时默认 1',
      example: 1
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      description: '每页数量，可选；只传 page 时默认 10，最大 100',
      example: 10
    }),
    ApiQuery({
      name: 'keyword',
      required: false,
      type: String,
      description: '关键字：邮箱、用户名、昵称、真实姓名、手机号',
      example: 'zhang'
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: '账号状态，可传单个或数组',
      schema: {
        oneOf: [
          { type: 'string', enum: userStatusEnum },
          { type: 'array', items: { type: 'string', enum: userStatusEnum } }
        ]
      },
      example: UserStatusSwagger.ACTIVE
    }),
    ApiQuery({
      name: 'role',
      required: false,
      description: '角色 code，可传单个或数组',
      schema: {
        oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }]
      },
      example: 'admin'
    }),
    ApiQuery({
      name: 'organizationId',
      required: false,
      type: String,
      description: '按在职组织 ID 筛选'
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: UsersSortBySwagger,
      description: '排序字段'
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: UsersSortOrderSwagger,
      description: '排序方向'
    })
  )
}
