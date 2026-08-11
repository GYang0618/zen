export interface OrganizationLeader {
  id: string
  name: string
  title: string
  avatar: string
  email: string
  phone: string
  online?: boolean
}

export interface Organization {
  id: string
  name: string
  code: string
  type: string
  description: string
  effectiveDate: string
  memberCount: number
  positionCount: number
  budget: number
  parentId?: string
  leader?: OrganizationLeader
  children?: Organization[]
}

export interface OrganizationMember {
  id: string
  avatar: string
  username: string
  nickname: string
  post: string
  organization: string
  postStatus: '在职' | '试用期' | '休假' | '离职'
  email: string
  phoneNumber: string
  level: string
}

export interface Position {
  id: number
  code: string
  name: string
  description: string
}

export interface ActivityItem {
  who: string
  action: string
  avatar: string
  description: string
  timestamp: string
}

export interface ActivityGroup {
  group: string
  items: ActivityItem[]
}

export interface OrganizationUserOption {
  id: string
  name: string
  title: string
  avatar: string
  email: string
  phone: string
}
