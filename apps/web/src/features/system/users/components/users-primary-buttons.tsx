import { PermissionCode } from '@zen/shared'
import { Button } from '@zen/ui'
import { UserPlus } from 'lucide-react'

import { Can } from '@/components/auth/can'

import { useUsers } from '../users-provider'

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers()
  return (
    <div className="flex gap-2">
      <Can permission={PermissionCode.USER_CREATE}>
        <Button size="lg" onClick={() => setOpen('add')}>
          <UserPlus />
          添加用户
        </Button>
      </Can>
    </div>
  )
}
