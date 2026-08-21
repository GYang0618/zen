import { PermissionCode } from '@zen/shared'
import { Button } from '@zen/ui'
import { Layers, Plus } from 'lucide-react'

import { Can } from '@/components/auth/can'

import { useOrganizations } from '../organizations-provider'

export function OrganizationsPrimaryButtons() {
  const { setOpen } = useOrganizations()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Can permission={PermissionCode.ORG_UPDATE}>
        <Button size="lg" variant="outline" onClick={() => setOpen('type-catalog')}>
          <Layers /> 组织类型
        </Button>
      </Can>
      <Button size="lg" onClick={() => setOpen('add')}>
        <Plus /> 新增组织
      </Button>
    </div>
  )
}
