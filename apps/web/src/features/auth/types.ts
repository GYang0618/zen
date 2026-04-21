import type { User } from '@/features/system/users'

export interface AuthSession {
  accessToken: string
  user: User
}
