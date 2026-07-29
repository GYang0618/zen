export type OrganizationMember = {
  id: string
  name: string
  role: string
  level: string
  location: string
  status: '在职' | '试用期' | '休假'
  avatar: string
}

export type OrganizationIcon =
  | 'landmark'
  | 'network'
  | 'building'
  | 'branch'
  | 'briefcase'
  | 'project'
  | 'users'

export type OrganizationNode = {
  id: string
  name: string
  code: string
  type: string
  icon?: OrganizationIcon
  leader: string
  leaderId?: string
  leaderRole: string
  memberCount: number
  headcount: number
  location: string
  description: string
  updatedAt: string
  members: OrganizationMember[]
  children?: OrganizationNode[]
}

export const organizationTree: OrganizationNode = {
  id: 'zen',
  name: '曜石科技',
  code: 'ZEN',
  type: '集团',
  leader: '周明远',
  leaderRole: '首席执行官',
  memberCount: 1286,
  headcount: 1398,
  location: '上海 · 北京 · 杭州',
  description: '曜石科技集团，专注于企业数字化与智能协作产品。',
  updatedAt: '2026-07-28 16:42',
  members: [],
  children: [
    {
      id: 'product',
      name: '产品研发中心',
      code: 'ZEN-PROD',
      type: '业务中心',
      leader: '陈予安',
      leaderRole: '产品副总裁',
      memberCount: 126,
      headcount: 135,
      location: '上海 · 杭州',
      description: '负责公司产品战略、体验设计与产品全生命周期管理。',
      updatedAt: '2026-07-29 09:18',
      members: [
        {
          id: 'u-01',
          name: '陈予安',
          role: '产品副总裁',
          level: 'M4',
          location: '上海',
          status: '在职',
          avatar: '陈'
        },
        {
          id: 'u-02',
          name: '林清禾',
          role: '高级产品经理',
          level: 'P7',
          location: '上海',
          status: '在职',
          avatar: '林'
        },
        {
          id: 'u-03',
          name: '沈知行',
          role: '产品经理',
          level: 'P6',
          location: '杭州',
          status: '在职',
          avatar: '沈'
        },
        {
          id: 'u-04',
          name: '苏晚晴',
          role: '高级交互设计师',
          level: 'P7',
          location: '上海',
          status: '在职',
          avatar: '苏'
        },
        {
          id: 'u-05',
          name: '唐屿',
          role: '用户研究员',
          level: 'P5',
          location: '北京',
          status: '试用期',
          avatar: '唐'
        },
        {
          id: 'u-06',
          name: '顾言深',
          role: '产品经理',
          level: 'P6',
          location: '深圳',
          status: '在职',
          avatar: '顾'
        }
      ],
      children: [
        {
          id: 'product-1',
          name: '产品一部',
          code: 'ZEN-PROD-01',
          type: '部门',
          leader: '林清禾',
          leaderRole: '部门负责人',
          memberCount: 34,
          headcount: 36,
          location: '上海',
          description: '负责核心产品线的规划与交付。',
          updatedAt: '2026-07-26 11:02',
          members: []
        },
        {
          id: 'product-2',
          name: '产品二部',
          code: 'ZEN-PROD-02',
          type: '部门',
          leader: '顾言深',
          leaderRole: '部门负责人',
          memberCount: 28,
          headcount: 30,
          location: '深圳',
          description: '负责增长产品与商业化产品。',
          updatedAt: '2026-07-25 14:10',
          members: []
        },
        {
          id: 'design',
          name: '用户体验部',
          code: 'ZEN-UX',
          type: '部门',
          leader: '苏晚晴',
          leaderRole: '部门负责人',
          memberCount: 22,
          headcount: 24,
          location: '上海 · 北京',
          description: '负责用户研究、体验设计与设计系统。',
          updatedAt: '2026-07-24 18:28',
          members: []
        }
      ]
    },
    {
      id: 'tech',
      name: '技术研发中心',
      code: 'ZEN-TECH',
      type: '业务中心',
      leader: '赵启明',
      leaderRole: '技术副总裁',
      memberCount: 286,
      headcount: 310,
      location: '上海 · 杭州',
      description: '负责平台架构、基础设施和工程效率。',
      updatedAt: '2026-07-28 10:38',
      members: []
    },
    {
      id: 'growth',
      name: '市场增长中心',
      code: 'ZEN-GROWTH',
      type: '业务中心',
      leader: '许知夏',
      leaderRole: '市场副总裁',
      memberCount: 158,
      headcount: 168,
      location: '上海 · 北京',
      description: '负责品牌、市场和商业增长。',
      updatedAt: '2026-07-27 16:15',
      members: []
    },
    {
      id: 'customer',
      name: '客户成功中心',
      code: 'ZEN-CS',
      type: '业务中心',
      leader: '叶嘉',
      leaderRole: '客户成功副总裁',
      memberCount: 204,
      headcount: 215,
      location: '全国',
      description: '负责客户交付、服务和客户关系经营。',
      updatedAt: '2026-07-26 09:50',
      members: []
    },
    {
      id: 'function',
      name: '职能支持中心',
      code: 'ZEN-FUNC',
      type: '职能中心',
      leader: '沈知微',
      leaderRole: '人力资源副总裁',
      memberCount: 96,
      headcount: 110,
      location: '上海',
      description: '负责组织、人力、财务与法务等职能支持。',
      updatedAt: '2026-07-23 13:22',
      members: []
    }
  ]
}

export function flattenOrganizations(node: OrganizationNode): OrganizationNode[] {
  return [node, ...(node.children ?? []).flatMap(flattenOrganizations)]
}
