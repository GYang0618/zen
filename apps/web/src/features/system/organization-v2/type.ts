export interface Organization {
  id: string
  name: string
  type: string
  memberCount: number
  parentId?: string
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
