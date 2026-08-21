import { Link } from '@tanstack/react-router'
import {
  Badge,
  Button,
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderMedia,
  PageHeaderTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import { ArrowLeft, Briefcase, Building2, History, Users } from 'lucide-react'
import { useState } from 'react'

import { AppHeader, Main } from '@/components/layouts'

import { OrganizationActivity } from './components/organization-activity'
import { OrganizationDetailSideOverview } from './components/organization-detail-side-overview'
import { OrganizationMembers } from './components/organization-members'
import { OrganizationPositions } from './components/organization-positions'
import { useOrganizationDetail, useOrganizationTypeCatalog } from './queries'

type OrganizationDetailProps = {
  organizationId: string
}

type OrganizationDetailTab = 'members' | 'positions' | 'changes'

export function OrganizationDetail({ organizationId }: OrganizationDetailProps) {
  const { data: organization, isLoading, isError } = useOrganizationDetail(organizationId)
  const { getLabel } = useOrganizationTypeCatalog()
  const [activeTab, setActiveTab] = useState<OrganizationDetailTab>('members')

  const handleTabChange = (value: string) => {
    if (value === 'members' || value === 'positions' || value === 'changes') {
      setActiveTab(value)
    }
  }

  if (isLoading) {
    return (
      <>
        <AppHeader />
        <Main className="flex flex-1 flex-col gap-4">
          <p className="py-12 text-center text-sm text-muted-foreground">加载组织详情…</p>
        </Main>
      </>
    )
  }

  if (isError || !organization) {
    return (
      <>
        <AppHeader />
        <Main className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm text-muted-foreground">组织不存在或无权访问</p>
            <Button variant="outline" asChild>
              <Link to="/system/organization">返回组织管理</Link>
            </Button>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <AppHeader />
      <Main className="flex flex-1 flex-col gap-4">
        <PageHeader size="lg">
          <Button variant="outline" size="icon-lg" className="rounded-full" asChild>
            <Link to="/system/organization" aria-label="返回组织管理">
              <ArrowLeft />
            </Link>
          </Button>
          <PageHeaderMedia>
            <Building2 />
          </PageHeaderMedia>
          <PageHeaderContent>
            <PageHeaderTitle as="h1" className="inline-flex flex-wrap items-center gap-3">
              {organization.name}
              <Badge variant="secondary">{getLabel(organization.type)}</Badge>
            </PageHeaderTitle>
            <PageHeaderDescription className="flex flex-wrap items-center gap-2 text-sm">
              <span>{organization.code}</span>
              {organization.description ? (
                <>
                  <span>•</span>
                  <span>{organization.description}</span>
                </>
              ) : null}
            </PageHeaderDescription>
          </PageHeaderContent>
        </PageHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList variant="line" className="mb-4 group-data-horizontal/tabs:h-12">
            <TabsTrigger value="members">
              <Users className="size-3.5" aria-hidden />
              成员 ({organization.memberCount})
            </TabsTrigger>
            <TabsTrigger value="positions">
              <Briefcase className="size-3.5" aria-hidden />
              岗位编制 ({organization.positionCount})
            </TabsTrigger>
            <TabsTrigger value="changes">
              <History className="size-3.5" aria-hidden />
              活动
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-6 @5xl/content:flex-row">
            <div className="min-w-0 flex-1">
              <TabsContent value="members">
                {activeTab === 'members' ? (
                  <OrganizationMembers organizationId={organizationId} />
                ) : null}
              </TabsContent>
              <TabsContent value="positions">
                {activeTab === 'positions' ? (
                  <OrganizationPositions organizationId={organizationId} />
                ) : null}
              </TabsContent>
              <TabsContent value="changes">
                {activeTab === 'changes' ? (
                  <OrganizationActivity organizationId={organizationId} />
                ) : null}
              </TabsContent>
            </div>

            <OrganizationDetailSideOverview organization={organization} />
          </div>
        </Tabs>
      </Main>
    </>
  )
}
