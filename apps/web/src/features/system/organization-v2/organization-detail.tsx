import { Link } from '@tanstack/react-router'
import {
  Badge,
  Button,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderMedia,
  PageHeaderTitle,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import { ArrowLeft, Briefcase, Building2, Camera, History, Pencil, Users } from 'lucide-react'

import { AppHeader, Main } from '@/components/layouts'

import { OrganizationDetailSideOverview } from './components/organization-detail-side-overview'
import { OrganizationMembers } from './components/organization-members'
import { flattenOrganizations, organizationTree } from './data'
import { organizationMembers } from './data/mock'

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
      <Main className="flex flex-1 flex-col gap-4">
        <PageHeader size="lg">
          <Button variant="outline" size="icon-lg" className="rounded-full" asChild>
            <Link to="/system/organization-v2" aria-label="返回组织管理">
              <ArrowLeft />
            </Link>
          </Button>
          <PageHeaderMedia>
            <Building2 />
          </PageHeaderMedia>
          <PageHeaderContent>
            <PageHeaderTitle as="h1" className="inline-flex flex-wrap items-center gap-3">
              {organization.name}
              <Badge variant="secondary">正常</Badge>
            </PageHeaderTitle>
            <PageHeaderDescription className="flex flex-wrap items-center gap-2 text-sm">
              <span>{organization.code}</span>
              <span>•</span>
              <span>{organization.type}</span>
              <span>•</span>
              <span>{organization.description}</span>
            </PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions>
            <Button variant="outline">
              <Pencil />
              编辑
            </Button>
            <Button variant="outline">
              <Camera />
              组织快照
            </Button>
            <Separator orientation="vertical" className="mx-1 h-8" />
          </PageHeaderActions>
        </PageHeader>

        <Tabs defaultValue="members">
          <TabsList variant="line" className="mb-4 group-data-horizontal/tabs:h-12">
            <TabsTrigger value="members">
              <Users className="size-3.5" aria-hidden />
              成员 ({organizationMembers.length})
            </TabsTrigger>
            <TabsTrigger value="posts">
              <Briefcase className="size-3.5" aria-hidden />
              岗位/编制 (5)
            </TabsTrigger>
            <TabsTrigger value="changes">
              <History className="size-3.5" aria-hidden />
              组织变更
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-6 @5xl/content:flex-row">
            <div className="min-w-0 flex-1">
              <TabsContent value="members">
                <OrganizationMembers items={organizationMembers} />
              </TabsContent>
              <TabsContent value="posts">岗位/编制</TabsContent>
              <TabsContent value="changes">组织变更</TabsContent>
            </div>

            <OrganizationDetailSideOverview />
          </div>
        </Tabs>
      </Main>
    </>
  )
}
