export interface Organization {
  id: string
  name: string
  type: string
  memberCount: number
  parentId?: string
  children?: Organization[]
}
