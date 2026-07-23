import { createPostSchema, PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import { Briefcase, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components'
import { Can } from '@/components/auth/can'
import { userApi } from '@/features/system/users/api'
import { EmptyState } from '@/features/system/components'

import {
  useCreatePost,
  useDeletePost,
  useOrganizationMembers,
  useOrganizationPosts,
  useRemoveOrganizationMember,
  useUpsertOrganizationMember
} from './queries'

export function OrgDetailPanel({ organizationId }: { organizationId: string }) {
  const { data: members, isLoading: membersLoading } = useOrganizationMembers(organizationId)
  const { data: posts, isLoading: postsLoading } = useOrganizationPosts(organizationId)
  const upsertMember = useUpsertOrganizationMember(organizationId)
  const removeMember = useRemoveOrganizationMember(organizationId)
  const createPost = useCreatePost()
  const deletePost = useDeletePost()
  const [userId, setUserId] = useState('')
  const [postCode, setPostCode] = useState('')
  const [postName, setPostName] = useState('')
  const [userHint, setUserHint] = useState('')
  const [removeUserId, setRemoveUserId] = useState<string | null>(null)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)

  const removeTarget = members?.find((member) => member.userId === removeUserId)
  const deletePostTarget = posts?.find((post) => post.id === deletePostId)

  return (
    <>
      <Card size="sm" className="gap-0 py-0">
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="text-sm">组织详情</CardTitle>
          <CardDescription>管理成员归属与岗位编制</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs defaultValue="members" className="flex flex-col gap-4">
            <TabsList>
              <TabsTrigger value="members">
                <Users data-icon="inline-start" />
                成员
                <Badge variant="secondary" className="ms-1">
                  {members?.length ?? 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="posts">
                <Briefcase data-icon="inline-start" />
                岗位
                <Badge variant="secondary" className="ms-1">
                  {posts?.length ?? 0}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="flex flex-col gap-3">
              <Can permission={PermissionCode.ORG_UPDATE}>
                <div className="flex flex-wrap gap-2">
                  <Input
                    className="max-w-xs"
                    placeholder="用户 ID / 用户名 / 邮箱"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value)
                      setUserHint('')
                    }}
                    aria-label="搜索并添加成员"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!userId.trim() || upsertMember.isPending}
                    onClick={async () => {
                      const keyword = userId.trim()
                      const list = await userApi.getUserList({ keyword, page: 1, pageSize: 5 })
                      const match =
                        list.items.find((item) => item.id === keyword) ??
                        list.items.find(
                          (item) => item.username === keyword || item.email === keyword
                        ) ??
                        list.items[0]
                      if (!match) {
                        setUserHint('未找到用户')
                        return
                      }
                      setUserHint('')
                      await upsertMember.mutateAsync({ userId: match.id, isPrimary: true })
                      toast.success(`已添加 ${match.nickname || match.username}`)
                      setUserId('')
                    }}
                  >
                    <UserPlus data-icon="inline-start" />
                    添加成员
                  </Button>
                </div>
                {userHint ? <p className="text-xs text-destructive">{userHint}</p> : null}
              </Can>

              {membersLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (members?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={Users}
                  title="暂无成员"
                  description="通过上方搜索添加组织成员"
                  compact
                />
              ) : (
                <ul className="divide-y rounded-lg border">
                  {members?.map((member) => (
                    <li
                      key={member.userId}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {member.nickname || member.username}
                          </span>
                          {member.isPrimary ? <Badge variant="secondary">主职</Badge> : null}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {member.email}
                          {member.postName ? ` · ${member.postName}` : ''}
                        </div>
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
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="posts" className="flex flex-col gap-3">
              <Can permission={PermissionCode.POST_MANAGE}>
                <div className="flex flex-wrap gap-2">
                  <Input
                    className="max-w-35"
                    placeholder="编码"
                    value={postCode}
                    onChange={(e) => setPostCode(e.target.value)}
                    aria-label="岗位编码"
                  />
                  <Input
                    className="max-w-40"
                    placeholder="名称"
                    value={postName}
                    onChange={(e) => setPostName(e.target.value)}
                    aria-label="岗位名称"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={createPost.isPending}
                    onClick={async () => {
                      const parsed = createPostSchema.safeParse({
                        code: postCode,
                        name: postName,
                        organizationId
                      })
                      if (!parsed.success) {
                        toast.error(parsed.error.issues[0]?.message ?? '表单校验失败')
                        return
                      }
                      await createPost.mutateAsync(parsed.data)
                      toast.success('岗位已创建')
                      setPostCode('')
                      setPostName('')
                    }}
                  >
                    新建岗位
                  </Button>
                </div>
              </Can>

              {postsLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (posts?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="暂无岗位"
                  description="创建岗位后可分配给组织成员"
                  compact
                />
              ) : (
                <ul className="divide-y rounded-lg border">
                  {posts?.map((post) => (
                    <li
                      key={post.id}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{post.name}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{post.code}</span>
                          <Badge variant={post.status === 'active' ? 'secondary' : 'outline'}>
                            {post.status}
                          </Badge>
                        </div>
                      </div>
                      <Can permission={PermissionCode.POST_MANAGE}>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deletePost.isPending}
                          onClick={() => setDeletePostId(post.id)}
                        >
                          删除
                        </Button>
                      </Can>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
              toast.success('已移除成员')
              setRemoveUserId(null)
            }
          })
        }}
      />

      <ConfirmDialog
        open={Boolean(deletePostId)}
        onOpenChange={(open) => {
          if (!open) setDeletePostId(null)
        }}
        title="删除岗位？"
        desc={
          deletePostTarget
            ? `确认删除岗位「${deletePostTarget.name}」？已关联成员可能受影响。`
            : '确认删除该岗位？'
        }
        confirmText="删除"
        cancelBtnText="取消"
        destructive
        isLoading={deletePost.isPending}
        handleConfirm={() => {
          if (!deletePostId) return
          deletePost.mutate(deletePostId, {
            onSuccess: () => {
              toast.success('岗位已删除')
              setDeletePostId(null)
            }
          })
        }}
      />
    </>
  )
}
