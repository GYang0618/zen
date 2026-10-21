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

  @ApiProperty({ description: '上一个 7 天新增用户数', example: 6 })
  previous7DaysCount!: number

  @ApiProperty({ description: '近 7 天环比增长率', example: 0.3333 })
  growthRate!: number

  @ApiProperty({ description: '近 30 天新增用户数', example: 25 })
  newUsersLast30Days!: number
}

export class UserActivityStatisticsSwaggerDto {
  @ApiProperty({ description: '近 7 天活跃登录用户数', example: 50 })
  activeUsersLast7Days!: number

  @ApiProperty({ description: '近 30 天活跃登录用户数', example: 85 })
  activeUsersLast30Days!: number

  @ApiProperty({ description: '从未登录过的用户数', example: 10 })
  neverLoggedInCount!: number
}

export class UserTrendItemSwaggerDto {
  @ApiProperty({ description: '日期 YYYY-MM-DD', example: '2026-10-21' })
  date!: string

  @ApiProperty({ description: '新增用户数', example: 3 })
  count!: number
}

export class UserTopOrganizationSwaggerDto {
  @ApiProperty({ description: '组织 ID', example: 'org-1' })
  id!: string

  @ApiProperty({ description: '组织名称', example: '研发中心' })
  name!: string

  @ApiProperty({ description: '在职用户数', example: 45 })
  userCount!: number
}

export class UserStatisticsShareSwaggerDto {
  @ApiProperty({ description: '分类名称', example: '已激活' })
  label!: string

  @ApiProperty({ description: '数量', example: 100 })
  value!: number

  @ApiProperty({ description: '占该分布合计的百分比，0-100', example: 86.2 })
  percentage!: number
}

export class UserStatisticsRateSwaggerDto {
  @ApiProperty({ description: '已激活占比，0-1', example: 0.86 })
  activationRate!: number

  @ApiProperty({ description: 'MFA 覆盖率，0-1', example: 0.3 })
  mfaCoverageRate!: number

  @ApiProperty({ description: '组织归属率，0-1', example: 0.9 })
  organizationAssignmentRate!: number

  @ApiProperty({ description: '角色绑定率，0-1', example: 0.95 })
  roleAssignmentRate!: number

  @ApiProperty({ description: '近 7 天活跃率，0-1', example: 0.4 })
  activeRate7d!: number

  @ApiProperty({ description: '近 30 天活跃率，0-1', example: 0.7 })
  activeRate30d!: number
}

export class UserStatisticsFunnelSwaggerDto {
  @ApiProperty({ description: '阶段名称', example: '在册用户' })
  label!: string

  @ApiProperty({ description: '阶段人数', example: 110 })
  value!: number
}

export class UserStatisticsHealthSwaggerDto {
  @ApiProperty({ description: '维度名称', example: '激活率' })
  label!: string

  @ApiProperty({ description: '0-100 分', example: 86 })
  value!: number
}

export class UserWeeklyNewUsersSwaggerDto {
  @ApiProperty({ description: '月-日', example: '10-21' })
  label!: string

  @ApiProperty({ description: '前 7 天同一顺位新增数', example: 2 })
  previous!: number

  @ApiProperty({ description: '近 7 天该日新增数', example: 4 })
  current!: number
}

export class UserCreationCalendarSwaggerDto {
  @ApiProperty({ description: '日期 YYYY-MM-DD', example: '2026-10-21' })
  date!: string

  @ApiProperty({ description: '当日新增', example: 3 })
  count!: number

  @ApiProperty({ description: '强度 0-4', example: 2 })
  level!: number

  @ApiProperty({ description: '悬浮提示', example: '2026-10-21：新增 3 人' })
  tooltip!: string
}

export class UserStatisticsSeriesSwaggerDto {
  @ApiProperty({ type: UserStatisticsRateSwaggerDto })
  rates!: UserStatisticsRateSwaggerDto

  @ApiProperty({ type: [UserStatisticsShareSwaggerDto] })
  statusDistribution!: UserStatisticsShareSwaggerDto[]

  @ApiProperty({ type: [UserStatisticsShareSwaggerDto] })
  genderDistribution!: UserStatisticsShareSwaggerDto[]

  @ApiProperty({ type: [UserStatisticsFunnelSwaggerDto] })
  funnel!: UserStatisticsFunnelSwaggerDto[]

  @ApiProperty({ type: [UserStatisticsHealthSwaggerDto] })
  health!: UserStatisticsHealthSwaggerDto[]

  @ApiProperty({ type: [UserWeeklyNewUsersSwaggerDto] })
  weeklyNewUsers!: UserWeeklyNewUsersSwaggerDto[]

  @ApiProperty({ type: [UserCreationCalendarSwaggerDto] })
  creationCalendar!: UserCreationCalendarSwaggerDto[]
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

  @ApiProperty({ type: UserActivityStatisticsSwaggerDto, description: '活跃度概况' })
  activity!: UserActivityStatisticsSwaggerDto

  @ApiProperty({ type: UserRecentTrendsStatisticsSwaggerDto, description: '新增趋势与环比' })
  recentTrends!: UserRecentTrendsStatisticsSwaggerDto

  @ApiProperty({ type: [UserTrendItemSwaggerDto], description: '近 14 天每日新增趋势' })
  trend!: UserTrendItemSwaggerDto[]

  @ApiProperty({ type: [UserTopOrganizationSwaggerDto], description: '用户规模排名前 5 的部门' })
  topOrganizations!: UserTopOrganizationSwaggerDto[]

  @ApiProperty({ type: UserStatisticsSeriesSwaggerDto, description: '可直接绑定图表的序列' })
  series!: UserStatisticsSeriesSwaggerDto
}

export class UserStatisticsSuccessSwaggerDto extends ApiSuccessResponseBaseSwaggerDto {
  @ApiProperty({ type: UserStatisticsSwaggerDto, description: '用户统计数据' })
  data!: UserStatisticsSwaggerDto
}
