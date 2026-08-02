import { PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  cn,
  Input,
  ScrollArea,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import { Briefcase, ChevronRight, Pencil, Plus, Settings, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components'
import { Can } from '@/components/auth/can'
import { EmptyState } from '@/features/system/config/components'
import { userApi } from '@/features/system/users/api'

import { DeptSettingsDialog } from './dept-settings-dialog'
import { PostFormDialog } from './post-form-dialog'
import {
  useOrganizationMembers,
  useOrganizationPosts,
  useRemoveOrganizationMember,
  useUpsertOrganizationMember
} from './queries'
import { findOrganizationPath, formatPostGrade, postInitials } from './utils'

import type { OrganizationTreeNode } from '@zen/shared'
import type { OrganizationPost } from './api'

type OrgDetailPanelProps = {
  organization: OrganizationTreeNode
  tree: OrganizationTreeNode[]
  parentOptions: OrganizationTreeNode[]
  onRequestDelete: (id: string) => void
}

function PostStatusBadge({ filled, headcount }: { filled: number; headcount: number }) {
  const full = filled >= headcount
  const vacancy = Math.max(headcount - filled, 0)

  if (full) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
        编制满员
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
      招聘中{vacancy > 0 ? ` (${vacancy}空缺)` : ''}
    </span>
  )
}

export function OrgDetailPanel({
  organization,
  tree,
  parentOptions,
  onRequestDelete
}: OrgDetailPanelProps) {
  const { data: members, isLoading: membersLoading } = useOrganizationMembers(organization.id)
  const { data: posts, isLoading: postsLoading } = useOrganizationPosts(organization.id)
  const upsertMember = useUpsertOrganizationMember(organization.id)
  const removeMember = useRemoveOrganizationMember(organization.id)

  const [tab, setTab] = useState('positions')
  const [postDialogOpen, setPostDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<OrganizationPost | null>(null)
  const [deptSettingsOpen, setDeptSettingsOpen] = useState(false)
  const [memberKeyword, setMemberKeyword] = useState('')
  const [memberHint, setMemberHint] = useState('')
  const [removeUserId, setRemoveUserId] = useState<string | null>(null)

  const breadcrumb = useMemo(
    () => findOrganizationPath(tree, organization.id) ?? [organization],
    [tree, organization]
  )

  const fillRate = useMemo(() => {
    if (!posts?.length) return null
    const totalHeadcount = posts.reduce((sum, post) => sum + post.headcount, 0)
    const totalFilled = posts.reduce((sum, post) => sum + post.filledCount, 0)
    if (totalHeadcount <= 0) return null
    return Math.round((totalFilled / totalHeadcount) * 100)
  }, [posts])

  const removeTarget = members?.find((member) => member.userId === removeUserId)
  const leaderLabel = organization.leaderName ?? '未指定'

  const openCreatePost = () => {
    setEditingPost(null)
    setPostDialogOpen(true)
  }

  const openEditPost = (post: OrganizationPost) => {
    setEditingPost(post)
    setPostDialogOpen(true)
  }

  return (
    <>
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card lg:max-h-[calc(100svh-12rem)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <nav
              className="mb-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
              aria-label="组织面包屑"
            >
              <span>组织架构</span>
              {breadcrumb.map((node, index) => (
                <span key={node.id} className="flex items-center gap-1">
                  <ChevronRight className="size-3" aria-hidden />
                  <span
                    className={cn(index === breadcrumb.length - 1 && 'font-medium text-foreground')}
                  >
                    {node.name}
                  </span>
                </span>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight">
                {organization.name} - 岗位与人员编制
              </h2>
              <Badge variant="outline" className="font-normal">
                负责人: <strong className="ms-1 font-medium text-foreground">{leaderLabel}</strong>
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDeptSettingsOpen(true)}>
            <Settings data-icon="inline-start" className="text-primary" />
            部门设置
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="shrink-0 px-6">
            <TabsList
              variant="line"
              className="h-auto w-max min-w-full justify-start gap-6 rounded-none border-b bg-transparent p-0"
            >
              <TabsTrigger value="positions" className="flex-none shrink-0 rounded-none px-0 pb-3">
                岗位列表 ({posts?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex-none shrink-0 rounded-none px-0 pb-3">
                人员花名册 ({members?.length ?? 0})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="p-6">
              <TabsContent value="positions" className="mt-0">
                <div className="overflow-hidden rounded-xl border shadow-xs">
                  <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">现有岗位明细</span>
                      {fillRate !== null ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          编制达成率 {fillRate}%
                        </span>
                      ) : null}
                    </div>
                    <Can permission={PermissionCode.POST_MANAGE}>
                      <Button size="sm" onClick={openCreatePost}>
                        <Plus data-icon="inline-start" />
                        添加新岗位
                      </Button>
                    </Can>
                  </div>

                  {postsLoading ? (
                    <div className="p-4">
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : (posts?.length ?? 0) === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={Briefcase}
                        title="暂无岗位"
                        description="为当前部门添加岗位并设置编制"
                        compact
                        action={
                          <Can permission={PermissionCode.POST_MANAGE}>
                            <Button size="sm" onClick={openCreatePost}>
                              <Plus data-icon="inline-start" />
                              添加新岗位
                            </Button>
                          </Can>
                        }
                      />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 text-xs uppercase tracking-wider">
                          <TableHead className="px-6">岗位名称</TableHead>
                          <TableHead className="px-6">岗级 / 职级</TableHead>
                          <TableHead className="px-6">直属上级</TableHead>
                          <TableHead className="px-6">编制人数 / 在职</TableHead>
                          <TableHead className="px-6">岗位状态</TableHead>
                          <TableHead className="px-6 text-end">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts?.map((post) => {
                          const underfilled = post.filledCount < post.headcount
                          return (
                            <TableRow key={post.id} className="hover:bg-muted/40">
                              <TableCell className="px-6">
                                <div className="flex items-center gap-2">
                                  <div className="flex size-7 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                                    {postInitials(post.name)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium">{post.name}</p>
                                    <span className="text-xs text-muted-foreground">
                                      {post.description || '暂无详细描述'}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 text-muted-foreground">
                                {formatPostGrade(post.grade)}
                              </TableCell>
                              <TableCell className="px-6 text-muted-foreground">
                                {organization.leaderName
                                  ? organization.leaderName
                                  : `${organization.name}负责人`}
                              </TableCell>
                              <TableCell className="px-6">
                                <span
                                  className={cn(
                                    'font-medium',
                                    underfilled && 'text-amber-600 dark:text-amber-400'
                                  )}
                                >
                                  {post.filledCount} / {post.headcount}
                                </span>
                              </TableCell>
                              <TableCell className="px-6">
                                <PostStatusBadge
                                  filled={post.filledCount}
                                  headcount={post.headcount}
                                />
                              </TableCell>
                              <TableCell className="px-6 text-end">
                                <Can permission={PermissionCode.POST_MANAGE}>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    title="编辑岗位"
                                    aria-label={`编辑岗位 ${post.name}`}
                                    onClick={() => openEditPost(post)}
                                  >
                                    <Pencil className="size-4" />
                                  </Button>
                                </Can>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="staff" className="mt-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold">{organization.name} - 员工花名册</h3>
                    <p className="text-xs text-muted-foreground">直属主管：{leaderLabel}</p>
                  </div>
                  <Can permission={PermissionCode.ORG_UPDATE}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        className="h-8 max-w-xs"
                        placeholder="用户 ID / 用户名 / 邮箱"
                        value={memberKeyword}
                        onChange={(event) => {
                          setMemberKeyword(event.target.value)
                          setMemberHint('')
                        }}
                        aria-label="搜索并添加成员"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!memberKeyword.trim() || upsertMember.isPending}
                        onClick={async () => {
                          const keyword = memberKeyword.trim()
                          const list = await userApi.getUserList({
                            keyword,
                            page: 1,
                            pageSize: 5
                          })
                          const match =
                            list.items.find((item) => item.id === keyword) ??
                            list.items.find(
                              (item) => item.username === keyword || item.email === keyword
                            ) ??
                            list.items[0]
                          if (!match) {
                            setMemberHint('未找到用户')
                            return
                          }
                          setMemberHint('')
                          await upsertMember.mutateAsync({
                            userId: match.id,
                            isPrimary: true
                          })
                          toast.success(`已添加 ${match.nickname || match.username}`)
                          setMemberKeyword('')
                        }}
                      >
                        <UserPlus data-icon="inline-start" />
                        添加成员
                      </Button>
                    </div>
                  </Can>
                </div>
                {memberHint ? <p className="text-xs text-destructive">{memberHint}</p> : null}

                {membersLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (members?.length ?? 0) === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="暂无成员"
                    description="通过上方搜索添加组织成员"
                    compact
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {members?.map((member) => {
                      const displayName = member.nickname || member.username
                      return (
                        <div
                          key={member.userId}
                          className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4"
                        >
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                            {displayName.slice(0, 1)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-medium">
                              {displayName}
                              {member.isPrimary ? (
                                <Badge variant="secondary" className="ms-2 align-middle">
                                  主职
                                </Badge>
                              ) : null}
                            </h4>
                            <p className="truncate text-xs text-muted-foreground">
                              {member.postName || '未分配岗位'}
                            </p>
                          </div>
                          <Can permission={PermissionCode.ORG_UPDATE}>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={removeMember.isPending}
                              onClick={() => setRemoveUserId(member.userId)}
                            >
                              移除
                            </Button>
                          </Can>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      <PostFormDialog
        open={postDialogOpen}
        onOpenChange={(open) => {
          setPostDialogOpen(open)
          if (!open) setEditingPost(null)
        }}
        organizationId={organization.id}
        post={editingPost}
      />

      <DeptSettingsDialog
        open={deptSettingsOpen}
        onOpenChange={setDeptSettingsOpen}
        organization={organization}
        parentOptions={parentOptions}
        onRequestDelete={() => onRequestDelete(organization.id)}
      />

      <ConfirmDialog
        open={Boolean(removeUserId)}
        onOpenChange={(open) => {
          if (!open) setRemoveUserId(null)
        }}
        title="移除成员？"
        desc={
          removeTarget
            ? `确认将「${removeTarget.nickname || removeTarget.username}」移出当前组织？`
            : '确认移除该成员？'
        }
        confirmText="移除"
        cancelBtnText="取消"
        destructive
        isLoading={removeMember.isPending}
        handleConfirm={() => {
          if (!removeUserId) return
          removeMember.mutate(removeUserId, {
            onSuccess: () => {
              setRemoveUserId(null)
            }
          })
        }}
      />
    </>
  )
}
