import { Button } from '@zen/ui'
import { UserPlus } from 'lucide-react'

import { useUsers } from '../users-provider'

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers()
  return (
    <div className="flex gap-2">
      {/* <Button variant="outline" className="space-x-1">
        <span>导入</span> <Upload size={18} />
      </Button>
      <Button variant="outline" className="space-x-1">
        <span>导出</span> <Download size={18} />
      </Button> */}
      <Button className="space-x-1" onClick={() => setOpen('add')}>
        <span>添加用户</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
