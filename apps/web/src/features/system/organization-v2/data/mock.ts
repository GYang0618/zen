import { fakerZH_CN as faker } from '@faker-js/faker'

import type { Organization, OrganizationMember } from '../type'

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
