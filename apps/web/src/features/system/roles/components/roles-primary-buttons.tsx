import { Button } from '@zen/ui'
import { ShieldPlus } from 'lucide-react'

import { useRoles } from '../roles-provider'

export function RolesPrimaryButtons() {
  const { setOpen } = useRoles()
  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen('add')}>
        <span>新增角色</span> <ShieldPlus size={18} />
      </Button>
    </div>
  )
}
