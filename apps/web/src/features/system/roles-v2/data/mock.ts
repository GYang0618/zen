import { fakerZH_CN as faker } from '@faker-js/faker'

import { ROLE_ICON_COLOR_VALUES, ROLE_ICONS } from './data'

import type { Role } from '../type'

faker.seed(20260810)

const ROLE_STATUSES = ['active', 'inactive', 'expired', 'locked'] as const

const ROLE_PRESETS = [
  { name: '超级管理员', code: 'SUPER_ADMIN' },
  { name: '系统管理员', code: 'SYSTEM_ADMIN' },
  { name: '人事经理', code: 'HR_MANAGER' },
  { name: '部门负责人', code: 'DEPT_LEAD' },
  { name: '安全审计员', code: 'SECURITY_AUDITOR' },
  { name: '访客', code: 'GUEST' },
  { name: '运维工程师', code: 'OPS_ENGINEER' },
  { name: '开放接口角色', code: 'API_INTEGRATION' },
  { name: '财务专员', code: 'FINANCE_STAFF' },
  { name: '产品经理', code: 'PRODUCT_MANAGER' },
  { name: '数据管理员', code: 'DATA_ADMIN' },
  { name: '客服主管', code: 'CS_LEAD' }
] as const

const PERMISSION_POOL = [
  'system:user:list',
  'system:user:create',
  'system:user:update',
  'system:user:delete',
  'system:user:status',
  'system:org:tree',
  'system:org:create',
  'system:org:update',
  'system:org:delete',
  'system:role:assign',
  'system:role:create',
  'system:role:delete'
] as const

const DESCRIPTION_TEMPLATES = [
  '负责{scope}相关事务，可{action}，适用于日常业务协作场景。',
  '面向{scope}人员配置，支持{action}，权限范围按最小必要原则收敛。',
  '用于{scope}场景下的访问控制，允许{action}，禁止越权操作。'
] as const

const SCOPES = ['用户与组织', '角色权限', '系统运维', '合规审计', '第三方集成', '部门协作'] as const
const ACTIONS = [
  '查看列表与详情',
  '创建与编辑基础信息',
  '调整账号状态',
  '维护组织节点',
  '分配角色权限',
  '只读复核操作留痕'
] as const

function createLatestMembers(count: number) {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    avatar: faker.image.avatarGitHub()
  }))
}

function createDescription() {
  return faker.helpers
    .arrayElement(DESCRIPTION_TEMPLATES)
    .replace('{scope}', faker.helpers.arrayElement(SCOPES))
    .replace('{action}', faker.helpers.arrayElement(ACTIONS))
}

function createRole(
  preset: (typeof ROLE_PRESETS)[number],
  status: Role['status'] = faker.helpers.arrayElement(ROLE_STATUSES)
): Role {
  const createdAt = faker.date.past({ years: 2 })
  const memberCount = faker.number.int({ min: 2, max: 64 })
  const latestMemberCount = Math.min(memberCount, faker.number.int({ min: 2, max: 3 }))
  const hasExpiry = status === 'expired' || faker.datatype.boolean(0.35)
  const isLocked = status === 'locked'

  return {
    id: faker.string.uuid(),
    name: preset.name,
    code: preset.code,
    icon: faker.helpers.arrayElement(ROLE_ICONS),
    iconColor: faker.helpers.arrayElement(ROLE_ICON_COLOR_VALUES),
    description: createDescription(),
    permissions: faker.helpers.arrayElements(
      [...PERMISSION_POOL],
      faker.number.int({ min: 2, max: PERMISSION_POOL.length })
    ),
    memberCount,
    latestMembers: createLatestMembers(latestMemberCount),
    status,
    expiredAt: hasExpiry
      ? faker.date[status === 'expired' ? 'past' : 'future']({ years: 1 })
          .toISOString()
          .slice(0, 10)
      : null,
    createdAt: createdAt.toISOString(),
    updatedAt: faker.datatype.boolean(0.8)
      ? faker.date.between({ from: createdAt, to: new Date() }).toISOString()
      : null,
    lockedAt: isLocked ? faker.date.recent({ days: 90 }).toISOString() : null
  }
}

const roleCount = faker.number.int({ min: 8, max: ROLE_PRESETS.length })
const selectedPresets = faker.helpers.arrayElements([...ROLE_PRESETS], roleCount)

/** 保证四种状态至少各一条，其余随机分配后再打乱顺序 */
const statusAssignments: Role['status'][] = faker.helpers.shuffle([
  ...ROLE_STATUSES,
  ...Array.from({ length: roleCount - ROLE_STATUSES.length }, () =>
    faker.helpers.arrayElement(ROLE_STATUSES)
  )
])

export const roles: Role[] = selectedPresets.map((preset, index) =>
  createRole(preset, statusAssignments[index])
)
