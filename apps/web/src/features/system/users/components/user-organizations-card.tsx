import { Link } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@zen/ui'
import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { organizationIconConfig } from '@/features/system/organization/data/data'

import { organizationTypeLabels } from '../data/data'
import { useReplaceUserOrganizationsMutation } from '../mutations'
import { formatDate, getUserDisplayName } from '../utils'

import type { User, UserOrganizationMembership } from '@zen/shared'

type UserOrganizationsCardProps = {
  user: User
  onAssign: () => void
}

export function UserOrganizationsCard({ user, onAssign }: UserOrganizationsCardProps) {
  const memberships = [...user.organizations].sort(
    (left, right) => Number(right.isPrimary) - Number(left.isPrimary)
  )
  const currentPrimary = memberships.find((item) => item.isPrimary)
  const [pendingPrimary, setPendingPrimary] = useState<UserOrganizationMembership>()
  const { mutate: replaceOrganizations, isPending } = useReplaceUserOrganizationsMutation()
  const canSwitchPrimary = memberships.length > 1

  const handleConfirmPrimary = () => {
    if (!pendingPrimary) return
    replaceOrganizations(
      {
        id: user.id,
        organizations: user.organizations.map((item) => ({
          organizationId: item.organizationId,
          isPrimary: item.organizationId === pendingPrimary.organizationId,
          postId: item.postId || null
        }))
      },
      {
        onSuccess: () => {
          toast.success('主职组织已更新，目标用户需重新登录')
          setPendingPrimary(undefined)
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : '更新主职失败')
      }
    )
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>组织归属</CardTitle>
        <CardDescription>主职与兼职组织、岗位将参与数据范围计算</CardDescription>
        <CardAction>
          <Can permission={PermissionCode.ORG_UPDATE}>
            <Button size="sm" className="rounded-full" onClick={onAssign}>
              <Building2 />
              管理组织
            </Button>
          </Can>
        </CardAction>
      </CardHeader>
      <CardContent>
        {memberships.length === 0 ? (
          <EmptyState
            title="暂无组织归属"
            description="该用户尚未加入任何组织"
            action={
              <Can permission={PermissionCode.ORG_UPDATE}>
                <Button size="sm" variant="outline" onClick={onAssign}>
                  管理组织
                </Button>
              </Can>
            }
          />
        ) : (
          <ItemGroup className="gap-3">
            {memberships.map((org) => {
              const config = organizationIconConfig[org.organizationType] ?? {
                icon: Building2,
                defaultColor: 'text-muted-foreground'
              }
              const Icon = config.icon
              const postLabel = org.postName
                ? `${org.postName}${org.postLevel ? ` · ${org.postLevel}` : ''}`
                : '未设岗位'

              return (
                <Item
                  key={org.organizationId}
                  variant="outline"
                  className="rounded-xl border px-4 py-4"
                >
                  <Link
                    to="/system/organization/$id"
                    params={{ id: org.organizationId }}
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <ItemMedia>
                      <span
                        className={cn(
                          'inline-flex size-10 items-center justify-center rounded-xl bg-muted',
                          config.defaultColor
                        )}
                      >
                        <Icon />
                      </span>
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="min-w-0">
                        <span className="truncate">{org.organizationName}</span>
                      </ItemTitle>
                      <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                        <Badge variant="outline">
                          {organizationTypeLabels[org.organizationType] ?? org.organizationType}
                        </Badge>
                        <span>{postLabel}</span>
                        {org.joinedAt ? <span>入职 {formatDate(org.joinedAt)}</span> : null}
                      </div>
                    </ItemContent>
                  </Link>
                  <ItemActions>
                    {org.isPrimary ? (
                      <Badge>主职</Badge>
                    ) : (
                      <Can
                        permission={PermissionCode.ORG_UPDATE}
                        fallback={<Badge variant="secondary">兼职</Badge>}
                      >
                        {canSwitchPrimary ? (
                          <div className="group/primary relative inline-flex items-center justify-end">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'transition-opacity duration-200',
                                'group-hover/primary:opacity-0 group-focus-within/primary:opacity-0',
                                '[@media(hover:none)]:opacity-0'
                              )}
                            >
                              兼职
                            </Badge>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              aria-label={`将${org.organizationName}设为主职`}
                              className={cn(
                                'absolute right-0',
                                'pointer-events-none opacity-0 transition-opacity duration-200',
                                'group-hover/primary:pointer-events-auto group-hover/primary:opacity-100',
                                'group-focus-within/primary:pointer-events-auto group-focus-within/primary:opacity-100',
                                'focus-visible:opacity-100',
                                '[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100'
                              )}
                              onClick={() => setPendingPrimary(org)}
                            >
                              设为主职
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="secondary">兼职</Badge>
                        )}
                      </Can>
                    )}
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(pendingPrimary)}
        onOpenChange={(open) => {
          if (!open && !isPending) setPendingPrimary(undefined)
        }}
        title="设为主职组织？"
        desc={`将「${pendingPrimary?.organizationName ?? ''}」设为 ${getUserDisplayName(user)} 的主职${currentPrimary ? `（当前主职为「${currentPrimary.organizationName}」）` : ''}。数据范围会随之变化，对方现有会话将被强制下线。`}
        cancelBtnText="取消"
        confirmText="设为主职"
        isLoading={isPending}
        handleConfirm={handleConfirmPrimary}
      />
    </Card>
  )
}
