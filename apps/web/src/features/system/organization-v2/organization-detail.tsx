import { Link } from '@tanstack/react-router'
import { Badge, Button, Separator } from '@zen/ui'
import { ArrowLeft, Building2, Copy, MoreHorizontal, Pencil, Plus } from 'lucide-react'

import { AppHeader, Main } from '@/components/layouts'

import { OrganizationMembers } from './components/organization-members'
import {
  OrganizationInfoCard,
  OrganizationMembersCard,
  OrganizationTimelineCard
} from './components/organization-side-cards'
import { flattenOrganizations, organizationTree } from './data'

type OrganizationDetailProps = {
  organizationId: string
}

export function OrganizationDetail({ organizationId }: OrganizationDetailProps) {
  const organization =
    flattenOrganizations(organizationTree).find((item) => item.id === organizationId) ??
    organizationTree

  return (
    <>
      <AppHeader />
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <Button variant="outline" size="icon-lg" className="rounded-full" asChild>
              <Link to="/system/organization-v2" aria-label="返回组织管理">
                <ArrowLeft />
              </Link>
            </Button>
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-medium tracking-tight">{organization.name}</h1>
                <Badge variant="secondary">正常</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{organization.code}</span>
                <span>•</span>
                <span>{organization.type}</span>
                <span>•</span>
                <span>{organization.description}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline">
              <Pencil data-icon="inline-start" />
              编辑
            </Button>
            <Button variant="outline">
              <Copy data-icon="inline-start" />
              复制组织
            </Button>
            <Separator orientation="vertical" className="mx-1 h-8" />
            <Button>
              <Plus data-icon="inline-start" />
              新建下级组织
            </Button>
            <Button variant="ghost" size="icon" aria-label="更多组织操作">
              <MoreHorizontal />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6 @5xl/content:flex-row">
          <div className="min-w-0 flex-1">
            <OrganizationMembers organization={organization} />
          </div>
          <aside className="bg-muted/35 flex w-full shrink-0 flex-col gap-4 rounded-[28px] border border-dashed p-3 @5xl/content:w-80 @5xl/content:self-start">
            <OrganizationInfoCard organization={organization} />
            <OrganizationMembersCard organization={organization} />
            <OrganizationTimelineCard />
          </aside>
        </div>
      </Main>
    </>
  )
}
