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
