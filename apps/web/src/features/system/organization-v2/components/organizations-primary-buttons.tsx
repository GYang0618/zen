import { Button } from '@zen/ui'
import { Plus } from 'lucide-react'

import { useOrganizations } from '../organizations-provider'

export function OrganizationsPrimaryButtons() {
  const { setOpen } = useOrganizations()

  return (
    <Button size="lg" onClick={() => setOpen('add')}>
      <Plus /> 新增组织
    </Button>
  )
}
