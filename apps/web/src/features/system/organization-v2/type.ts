import type {
  Organization as SharedOrganization,
  OrganizationActivity,
  OrganizationLeader as SharedOrganizationLeader,
  OrganizationMember as SharedOrganizationMember,
  OrganizationTreeNode,
  Position as SharedPosition
} from '@zen/shared'

/** 树节点即 API OrganizationTreeNode */
export type Organization = OrganizationTreeNode

export type OrganizationLeader = SharedOrganizationLeader & {
  online?: boolean
}

export type OrganizationMember = SharedOrganizationMember

export type Position = SharedPosition

export type ActivityItem = {
  who: string
  action: string
  avatar: string
  description: string
  timestamp: string
}

export type ActivityGroup = {
  group: string
  items: ActivityItem[]
}

export type OrganizationUserOption = {
  id: string
  name: string
  title: string
  avatar: string
  email: string
  phone: string
}

export type { OrganizationActivity, SharedOrganization }
