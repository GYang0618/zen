import { PermissionCode } from '@zen/shared'
import { Button } from '@zen/ui'
import { Plus } from 'lucide-react'

import { Can } from '@/components/auth/can'

import { useRoles } from '../roles-provider'

export function RolesPrimaryButtons() {
  const { setOpen } = useRoles()
  return (
    <div className="flex gap-2">
      <Can permission={PermissionCode.ROLE_CREATE}>
        <Button size="lg" onClick={() => setOpen('add')}>
          <Plus /> 新增角色
        </Button>
      </Can>
    </div>
  )
}
