import type { IconName } from 'lucide-react/dynamic'

export type RoleIconColor =
  | 'slate'
  | 'sky'
  | 'teal'
  | 'emerald'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'indigo'

export interface Role {
  id: string
  name: string
  code: string
  icon: IconName | null
  iconColor: RoleIconColor | null
  description: string
  permissions: string[]
  memberCount: number
  latestMembers: {
    id: string
    name: string
    avatar: string
  }[]
  status: 'active' | 'inactive' | 'expired' | 'locked'
  expiredAt: string | null
  createdAt: string
  updatedAt: string | null
  lockedAt: string | null
}
