import { PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@zen/ui'
import { Building2 } from 'lucide-react'

import { Can } from '@/components/auth/can'
import { EmptyState } from '@/components/empty-state'

import { organizationTypeLabels } from '../data/data'
import { formatDate } from '../utils'

import type { User } from '@zen/shared'

type UserOrganizationsCardProps = {
  user: User
  onAssign: () => void
}

export function UserOrganizationsCard({ user, onAssign }: UserOrganizationsCardProps) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>组织归属</CardTitle>
        <CardDescription>主职与兼职组织、岗位将参与数据范围计算</CardDescription>
        <CardAction>
          <Can permission={PermissionCode.ORG_UPDATE}>
            <Button size="sm" className="rounded-full" onClick={onAssign}>
              <Building2 />
              调整组织
            </Button>
          </Can>
        </CardAction>
      </CardHeader>
      <CardContent>
        {user.organizations.length === 0 ? (
          <EmptyState
            title="暂无组织归属"
            description="该用户尚未加入任何组织"
            action={
              <Can permission={PermissionCode.ORG_UPDATE}>
                <Button size="sm" variant="outline" onClick={onAssign}>
                  调整组织
                </Button>
              </Can>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {user.organizations.map((org) => (
              <div
                key={org.organizationId}
                className="flex items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{org.organizationName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        organizationTypeLabels[org.organizationType],
                        org.postName
                          ? `${org.postName}${org.postLevel ? ` · ${org.postLevel}` : ''}`
                          : null,
                        org.joinedAt ? `入职 ${formatDate(org.joinedAt)}` : null
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </div>
                <Badge variant={org.isPrimary ? 'default' : 'secondary'}>
                  {org.isPrimary ? '主职' : '兼职'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
