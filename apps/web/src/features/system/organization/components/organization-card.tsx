import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardHeader,
  cn,
  Field,
  FieldLabel,
  Separator
} from '@zen/ui'
import { Briefcase, CalendarDays, Hash, UserCheck, Users } from 'lucide-react'

import { organizationTypeLabels } from '../data/data'
import { OrganizationTypeIcon } from './organization-icon'

import type { Organization } from '@zen/shared'

export interface OrganizationCardProps {
  organization: Organization
  className?: string
  onClick?: () => void
}

export function OrganizationCard({ organization, className, onClick }: OrganizationCardProps) {
  const typeLabel = organizationTypeLabels[organization.type] ?? organization.type
  const leader = organization.leader

  return (
    <Card
      className={cn(
        'gap-3 transition-colors hover:border-primary/40',
        onClick && 'cursor-pointer select-none',
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
              <OrganizationTypeIcon type={organization.type} className="size-4.5" />
            </div>
            <div className="flex min-w-0 flex-col">
              <h3 className="truncate font-semibold text-foreground text-sm tracking-tight">
                {organization.name}
              </h3>
              <span className="flex items-center gap-1 font-mono text-muted-foreground text-xs">
                <Hash className="size-3 shrink-0" />
                {organization.code}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 text-[11px]">
            {typeLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserCheck className="size-3.5 shrink-0" />
            <span>负责人</span>
          </div>
          {leader ? (
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Avatar size="sm" className="size-5">
                {leader.avatar ? <AvatarImage src={leader.avatar} alt={leader.name} /> : null}
                <AvatarFallback className="text-[10px]">
                  {leader.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-28">{leader.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground/70">未设置</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <Field className="gap-0.5">
            <FieldLabel className="text-[11px] font-normal text-muted-foreground">
              <Users className="mr-1 inline-block size-3 shrink-0" />
              在编成员
            </FieldLabel>
            <span className="font-medium text-foreground text-xs">
              {organization.memberCount} 人
            </span>
          </Field>
          <Field className="gap-0.5">
            <FieldLabel className="text-[11px] font-normal text-muted-foreground">
              <Briefcase className="mr-1 inline-block size-3 shrink-0" />
              岗位编制
            </FieldLabel>
            <span className="font-medium text-foreground text-xs">
              {organization.positionCount} 个
            </span>
          </Field>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3 shrink-0" />
            生效日期
          </span>
          <span className="font-mono">{organization.effectiveDate}</span>
        </div>
      </CardContent>
    </Card>
  )
}
