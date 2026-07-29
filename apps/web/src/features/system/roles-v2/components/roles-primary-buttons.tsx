import { Button } from '@zen/ui'
import { Plus } from 'lucide-react'

import { useRoles } from '../roles-provider'

export function RolesPrimaryButtons() {
  const { setOpen } = useRoles()
  return (
    <div className="flex gap-2">
      <Button size="lg" onClick={() => setOpen('add')}>
        <Plus /> 新增角色
      </Button>
    </div>
  )
}
