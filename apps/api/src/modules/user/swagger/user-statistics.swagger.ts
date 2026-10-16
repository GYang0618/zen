import { ApiProperty } from '@nestjs/swagger'

import { ApiSuccessResponseBaseSwaggerDto } from '../../../common/swagger/index.js'

export class UserStatusStatisticsSwaggerDto {
  @ApiProperty({ description: '正常可用账号数', example: 100 })
  active!: number

  @ApiProperty({ description: '尚未激活账号数', example: 5 })
  inactive!: number

  @ApiProperty({ description: '待审核账号数', example: 2 })
  pending!: number

  @ApiProperty({ description: '已停用/已封禁账号数', example: 3 })
  suspended!: number
}

export class UserGenderStatisticsSwaggerDto {
  @ApiProperty({ description: '男性用户数', example: 60 })
  male!: number

  @ApiProperty({ description: '女性用户数', example: 45 })
  female!: number

  @ApiProperty({ description: '未知性别用户数', example: 5 })
  unknown!: number
}

export class UserSecurityStatisticsSwaggerDto {
  @ApiProperty({ description: '锁定账号数', example: 1 })
  lockedCount!: number

  @ApiProperty({ description: '开启 MFA 账号数', example: 30 })
  mfaEnabledCount!: number

  @ApiProperty({ description: '需强制修改密码账号数', example: 4 })
  mustChangePasswordCount!: number
}

export class UserAssignmentStatisticsSwaggerDto {
  @ApiProperty({ description: '已分配组织归属用户数', example: 98 })
  assignedCount!: number

  @ApiProperty({ description: '未分配组织归属用户数', example: 12 })
  unassignedCount!: number

  @ApiProperty({ description: '未绑定任何角色用户数', example: 2 })
  noRoleCount!: number
}

export class UserRecentTrendsStatisticsSwaggerDto {
  @ApiProperty({ description: '近 7 天新增用户数', example: 8 })
  newUsersLast7Days!: number

  @ApiProperty({ description: '近 30 天新增用户数', example: 25 })
  newUsersLast30Days!: number
}

export class UserStatisticsSwaggerDto {
  @ApiProperty({ description: '未删除用户总数', example: 110 })
  total!: number

  @ApiProperty({ description: '已软删除用户数', example: 6 })
  deletedCount!: number

  @ApiProperty({ type: UserStatusStatisticsSwaggerDto, description: '按状态分布统计' })
  byStatus!: UserStatusStatisticsSwaggerDto

  @ApiProperty({ type: UserGenderStatisticsSwaggerDto, description: '按性别分布统计' })
  byGender!: UserGenderStatisticsSwaggerDto

  @ApiProperty({ type: UserSecurityStatisticsSwaggerDto, description: '安全与锁定状况' })
  security!: UserSecurityStatisticsSwaggerDto

  @ApiProperty({ type: UserAssignmentStatisticsSwaggerDto, description: '组织与角色归属覆盖率' })
  assignment!: UserAssignmentStatisticsSwaggerDto

  @ApiProperty({ type: UserRecentTrendsStatisticsSwaggerDto, description: '新增趋势' })
  recentTrends!: UserRecentTrendsStatisticsSwaggerDto
}

export class UserStatisticsSuccessSwaggerDto extends ApiSuccessResponseBaseSwaggerDto {
  @ApiProperty({ type: UserStatisticsSwaggerDto, description: '用户统计数据' })
  data!: UserStatisticsSwaggerDto
}
