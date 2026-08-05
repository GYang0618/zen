import { fakerZH_CN as faker } from '@faker-js/faker'

import type {
  ActivityGroup,
  ActivityItem,
  Organization,
  OrganizationMember,
  Position
} from '../type'

faker.seed(20260801)

const ORG_TYPES = {
  GROUP: 'GROUP',
  COMPANY: 'COMPANY',
  BRANCH: 'BRANCH',
  CENTER: 'CENTER',
  DEPARTMENT: 'DEPARTMENT',
  TEAM: 'TEAM',
  POST: 'POST'
} as const

type OrgType = (typeof ORG_TYPES)[keyof typeof ORG_TYPES]

const CENTER_NAMES = [
  '产品研发中心',
  '技术研发中心',
  '市场增长中心',
  '客户成功中心',
  '职能支持中心',
  '数据智能中心'
] as const

const DEPARTMENT_NAMES = [
  '产品一部',
  '产品二部',
  '用户体验部',
  '前端工程部',
  '后端平台部',
  '基础设施部',
  '质量保障部',
  '品牌市场部',
  '销售运营部',
  '客户服务部',
  '人力资源部',
  '财务共享部'
] as const

const TEAM_NAMES = [
  '核心产品组',
  '增长实验组',
  '设计系统组',
  '平台架构组',
  '效能工程组',
  '交付保障组'
] as const

const POST_NAMES = [
  '产品经理',
  '高级产品经理',
  '前端工程师',
  '后端工程师',
  '设计师',
  '项目经理',
  '运营专员'
] as const

function sumMemberCount(nodes: Organization[]): number {
  return nodes.reduce((sum, node) => sum + node.memberCount, 0)
}

function createNode(
  name: string,
  type: OrgType,
  parentId: string | undefined,
  children?: Organization[]
): Organization {
  const id = faker.string.uuid()
  return {
    id,
    name,
    type,
    parentId,
    children,
    memberCount: children?.length ? sumMemberCount(children) : faker.number.int({ min: 3, max: 48 })
  }
}

function withChildren(node: Organization, children: Organization[]): Organization {
  return {
    ...node,
    children,
    memberCount: sumMemberCount(children)
  }
}

function createPosts(parentId: string): Organization[] {
  const names = faker.helpers.arrayElements([...POST_NAMES], faker.number.int({ min: 1, max: 3 }))
  return names.map((name) => createNode(name, ORG_TYPES.POST, parentId))
}

function createTeams(parentId: string): Organization[] {
  const names = faker.helpers.arrayElements([...TEAM_NAMES], faker.number.int({ min: 1, max: 2 }))
  return names.map((name) => {
    const team = createNode(name, ORG_TYPES.TEAM, parentId)
    return withChildren(team, createPosts(team.id))
  })
}

function createDepartments(parentId: string): Organization[] {
  const names = faker.helpers.arrayElements(
    [...DEPARTMENT_NAMES],
    faker.number.int({ min: 2, max: 3 })
  )
  return names.map((name) => {
    const department = createNode(name, ORG_TYPES.DEPARTMENT, parentId)
    return withChildren(department, createTeams(department.id))
  })
}

function createCenters(parentId: string): Organization[] {
  const names = faker.helpers.arrayElements([...CENTER_NAMES], faker.number.int({ min: 2, max: 3 }))
  return names.map((name) => {
    const center = createNode(name, ORG_TYPES.CENTER, parentId)
    return withChildren(center, createDepartments(center.id))
  })
}

function createBranches(parentId: string): Organization[] {
  return Array.from({ length: faker.number.int({ min: 1, max: 2 }) }, () => {
    const branch = createNode(`${faker.location.city()}分公司`, ORG_TYPES.BRANCH, parentId)
    return withChildren(branch, createCenters(branch.id))
  })
}

function createCompanies(parentId: string): Organization[] {
  return Array.from({ length: 2 }, () => {
    const company = createNode(`${faker.company.name()}有限公司`, ORG_TYPES.COMPANY, parentId)
    return withChildren(company, createBranches(company.id))
  })
}

function createOrganizationTree(): Organization[] {
  const group = createNode('曜石科技集团', ORG_TYPES.GROUP, undefined)
  return [withChildren(group, createCompanies(group.id))]
}

export const organizations: Organization[] = createOrganizationTree()

const POST_STATUSES = ['在职', '试用期', '休假', '离职'] as const
const LEVELS = ['P4', 'P5', 'P6', 'P7', 'P8', 'M1', 'M2', 'M3'] as const

faker.seed(20260802)

function createOrganizationMember(): OrganizationMember {
  const nickname = faker.person.fullName()
  const username = faker.internet
    .username({ firstName: nickname.slice(0, 1), lastName: nickname.slice(1) })
    .toLowerCase()

  return {
    id: faker.string.uuid(),
    avatar: faker.image.avatar(),
    username,
    nickname,
    post: faker.helpers.arrayElement(POST_NAMES),
    organization: faker.helpers.arrayElement(DEPARTMENT_NAMES),
    postStatus: faker.helpers.arrayElement(POST_STATUSES),
    email: faker.internet.email({ firstName: username }).toLowerCase(),
    phoneNumber: faker.phone.number({ style: 'national' }),
    level: faker.helpers.arrayElement(LEVELS)
  }
}

export const organizationMembers: OrganizationMember[] = Array.from(
  { length: 30 },
  createOrganizationMember
)

const POSITION_NAMES = [
  '高级前端工程师',
  '后端平台工程师',
  '产品经理',
  '资深设计师',
  '项目经理',
  '数据工程师',
  '质量保障工程师',
  '运维工程师'
] as const

const POSITION_DESCRIPTIONS = [
  '负责核心业务产品的前端架构设计与落地交付。',
  '负责平台服务稳定性、可扩展性与研发效能提升。',
  '负责产品规划、需求拆解与跨团队协同推进。',
  '负责体验设计、设计系统建设与交互方案输出。',
  '负责项目节奏管理、风险识别与交付质量把控。',
  '负责数据模型设计、指标建设与分析能力支撑。'
] as const

faker.seed(20260803)

function createPosition(index: number): Position {
  const name = faker.helpers.arrayElement(POSITION_NAMES)

  return {
    id: index + 1,
    code: `POS-${faker.string.numeric(4)}`,
    name,
    description: faker.helpers.arrayElement(POSITION_DESCRIPTIONS)
  }
}

export const organizationPositions: Position[] = Array.from({ length: 8 }, (_, index) =>
  createPosition(index)
)

const ACTIVITY_ACTIONS = [
  '加入了组织',
  '调整了岗位',
  '更新了组织信息',
  '创建了子部门',
  '移交了管理权限',
  '停用了岗位编制',
  '完成了成员调岗',
  '归档了组织快照'
] as const

const ACTIVITY_DESCRIPTIONS = [
  '从「客户成功中心」调入本组织，岗位变更为产品经理。',
  '岗位由「前端工程师」调整为「高级前端工程师」，职级同步更新。',
  '更新了组织编码、负责人与对外展示名称。',
  '在本组织下新建「效能工程组」，并完成编制初始化。',
  '将组织管理员权限移交给新负责人，原管理员保留查看权限。',
  '停用空编岗位，释放编制额度供其他团队使用。',
  '完成跨部门调岗审批，成员已同步至目标组织花名册。',
  '生成组织快照，记录当时成员结构与岗位编制情况。'
] as const

const ACTIVITY_GROUP_LABELS = ['今天', '昨天', '本周', '更早'] as const

faker.seed(20260804)

function createActivityItem(): ActivityItem {
  const who = faker.person.fullName()
  const action = faker.helpers.arrayElement(ACTIVITY_ACTIONS)
  const hour = faker.number.int({ min: 8, max: 20 })
  const minute = faker.number.int({ min: 0, max: 59 })

  return {
    who,
    action,
    avatar: faker.image.avatar(),
    description: faker.helpers.arrayElement(ACTIVITY_DESCRIPTIONS),
    timestamp: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
}

function createActivityGroup(group: string, count: number): ActivityGroup {
  return {
    group,
    items: Array.from({ length: count }, createActivityItem)
  }
}

export const organizationActivities: ActivityGroup[] = [
  createActivityGroup(ACTIVITY_GROUP_LABELS[0], 3),
  createActivityGroup(ACTIVITY_GROUP_LABELS[1], 2),
  createActivityGroup(ACTIVITY_GROUP_LABELS[2], 4),
  createActivityGroup(ACTIVITY_GROUP_LABELS[3], 3)
]
