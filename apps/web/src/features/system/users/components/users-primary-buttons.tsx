import { Button } from '@zen/ui'
import { Download, Upload, UserPlus } from 'lucide-react'

export function UsersPrimaryButtons() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" className="space-x-1">
        <span>导入</span> <Upload size={18} />
      </Button>
      <Button variant="outline" className="space-x-1">
        <span>导出</span> <Download size={18} />
      </Button>
      <Button className="space-x-1">
        <span>添加用户</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
