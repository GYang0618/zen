import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Separator
} from '@zen/ui'
import {
  Briefcase,
  Building2,
  Calendar,
  FolderTree,
  IdCard,
  Mail,
  Pencil,
  Phone,
  Plus,
  User
} from 'lucide-react'

import { getOrganizationTypeLabel } from '../data/data'
import { useOrganizations } from '../organizations-provider'
import { findOrganization, formatEffectiveDate } from '../utils'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface CoreField {
  label: string
  value: string | number | ReactNode
  icon: LucideIcon
}

export function OrganizationSideOverview() {
  const { currentNode, organizations, setOpen } = useOrganizations()

  if (!currentNode) return null

  const parent = currentNode.parentId
    ? findOrganization(organizations, currentNode.parentId)
    : undefined

  const coreFields: CoreField[] = [
    {
      label: '编码',
      value: currentNode.code,
      icon: IdCard
    },
    {
      label: '上级组织',
      value: parent?.name ?? '根节点',
      icon: FolderTree
    },
    {
      label: '成员',
      value: currentNode.memberCount,
      icon: User
    },
    {
      label: '岗位',
      value: currentNode.positionCount,
      icon: Briefcase
    },
    {
      label: '生效日期',
      value: formatEffectiveDate(currentNode.effectiveDate),
      icon: Calendar
    }
  ]

  const leader = currentNode.leader

  return (
    <aside className="h-max space-y-6 rounded-3xl border border-border/60 bg-muted/30 p-5 xl:p-6">
      <Card className="rounded-2xl bg-background/80">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3 font-bold">
                <Building2 className="shrink-0" />
                <h2 className="truncate text-xl">{currentNode.name}</h2>
                <Badge variant="secondary">{getOrganizationTypeLabel(currentNode.type)}</Badge>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="编辑组织基础信息"
                onClick={() => setOpen('edit')}
              >
                <Pencil />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>{currentNode.description || '暂未填写组织描述'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 bg-background/80">
          <Separator />
          <div className="space-y-3">
            {coreFields.map((field) => {
              const Icon = field.icon
              return (
                <div key={field.label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="size-4" /> {field.label}
                  </span>

                  {typeof field.value === 'string' || typeof field.value === 'number' ? (
                    <span className="text-right font-medium">{field.value}</span>
                  ) : (
                    field.value
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-background/80">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <h2>负责人</h2>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="编辑负责人"
                onClick={() => setOpen('edit-leader')}
              >
                <Pencil />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leader ? (
            <>
              <Item className="mb-5 p-0">
                <ItemMedia>
                  <Avatar className="size-14">
                    <AvatarImage src={leader.avatar ?? undefined} alt={leader.name} />
                    <AvatarFallback>{leader.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="text-xl">{leader.name}</ItemTitle>
                  <ItemDescription>{leader.title || '—'}</ItemDescription>
                </ItemContent>
              </Item>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="size-4" />
                  <span>{leader.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  <span>{leader.email || '—'}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="border border-dashed rounded-2xl h-20 flex items-center justify-center">
              <Plus />
            </p>
          )}
        </CardContent>
      </Card>
    </aside>
  )
}
