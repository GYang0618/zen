import { Card, CardContent } from '@zen/ui'

import { organizationTree } from '../data'
import { useOrganizations } from '../organizations-provider'
import { OrganizationTree } from './organization-tree'

export function OrganizationsView() {
  const { setCurrentNode } = useOrganizations()

  return (
    <section>
      <Card className="py-3">
        <CardContent className="px-2">
          <OrganizationTree data={[organizationTree]} onSelect={(node) => setCurrentNode(node)} />
        </CardContent>
      </Card>
    </section>
  )
}
