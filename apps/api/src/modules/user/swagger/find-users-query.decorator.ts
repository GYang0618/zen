import { applyDecorators } from '@nestjs/common'
import { ApiQuery } from '@nestjs/swagger'

import {
  UserStatusSwagger,
  UsersSortBySwagger,
  UsersSortOrderSwagger
} from './user-status.swagger.js'

/** 为 GET /user 列表接口生成查询参数 OpenAPI 描述 */
export function ApiFindUsersQueryDocs() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: '页码，需与 pageSize 同时传入',
      example: 1
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      description: '每页数量，需与 page 同时传入，最大 100',
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
      enum: UserStatusSwagger,
      isArray: true,
      description: '账号状态，可传单个或数组',
      example: UserStatusSwagger.ACTIVE
    }),
    ApiQuery({
      name: 'role',
      required: false,
      isArray: true,
      type: String,
      description: '角色 code，可传单个或数组',
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
