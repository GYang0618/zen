import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Separator
} from '@zen/ui'
import {
  CheckCircle,
  Ellipsis,
  Mail,
  Phone,
  Search,
  UserPlus,
  UserRoundArrowLeft,
  UserRoundMinus
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { useOrganizationMembers } from '../queries'
import { OrganizationAddMemberDialog } from './organization-add-member-dialog'
import { OrganizationRemoveMemberDialog } from './organization-remove-member-dialog'

import type { OrganizationMember } from '../type'

const EMPTY_MEMBERS: OrganizationMember[] = []

type MemberDialog = { type: 'add' } | { type: 'remove'; member: OrganizationMember } | null

function displayName(member: OrganizationMember): string {
  return member.nickname ?? member.username
}

function matchesMember(member: OrganizationMember, keyword: string): boolean {
  const q = keyword.trim().toLowerCase()
  if (!q) return true
  return [
    member.nickname,
    member.username,
    member.email,
    member.post,
    member.level,
    member.phoneNumber
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(q)
}

function accountStatusLabel(status: OrganizationMember['accountStatus']): string {
  if (status === 'active') return '已激活'
  if (status === 'pending') return '待激活'
  if (status === 'suspended') return '已停用'
  return '未激活'
}

export function OrganizationMembers({ organizationId }: { organizationId: string }) {
  const { data: membersData, isLoading } = useOrganizationMembers(organizationId)
  const members = membersData ?? EMPTY_MEMBERS

  const [keyword, setKeyword] = useState('')
  const [dialog, setDialog] = useState<MemberDialog>(null)

  const memberIds = useMemo(
    () => new Set(membersData?.map((member) => member.id) ?? []),
    [membersData]
  )

  const filteredMembers = useMemo(
    () => members.filter((member) => matchesMember(member, keyword)),
    [keyword, members]
  )

  return (
    <div className="@container flex flex-col gap-4">
      <section className="flex flex-wrap items-center gap-3">
        <InputGroup className="max-w-sm min-w-56 flex-1">
          <InputGroupInput
            placeholder="搜索成员姓名、岗位或邮箱"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Button type="button" onClick={() => setDialog({ type: 'add' })}>
          <UserPlus />
          添加成员
        </Button>
      </section>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">加载成员…</p>
      ) : filteredMembers.length ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
          {filteredMembers.map((item) => {
            const name = displayName(item)
            return (
              <Card key={item.id} className="relative rounded-2xl bg-background/80">
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`打开${name}的成员操作`}
                      >
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDialog({ type: 'remove', member: item })}
                        >
                          <UserRoundMinus />
                          移除成员
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardContent>
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Avatar className="size-14">
                      <AvatarImage src={item.avatar ?? undefined} />
                      <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                      {item.accountStatus === 'active' ? (
                        <AvatarBadge className="bg-green-600 dark:bg-green-800" />
                      ) : null}
                    </Avatar>

                    <div className="text-center">
                      <h3 className="truncate text-sm font-semibold dark:text-zinc-100">{name}</h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground dark:text-zinc-400">
                        {[item.post, item.level].filter(Boolean).join(' · ') || '未分配岗位'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <div className="inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        成员
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground dark:text-zinc-400">
                        <CheckCircle className="size-3.5 text-green-500" />
                        {accountStatusLabel(item.accountStatus)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-transparent p-0">
                  <div className="flex flex-1 cursor-pointer items-center justify-center gap-2 px-3 py-2.5 transition-colors hover:bg-muted/50">
                    <Mail className="size-4" />
                    <span>邮箱</span>
                  </div>
                  <Separator orientation="vertical" className="h-full" />
                  <div className="flex flex-1 cursor-pointer items-center justify-center gap-2 px-3 py-2.5 transition-colors hover:bg-muted/50">
                    <Phone className="size-4" />
                    <span>电话</span>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundArrowLeft />
            </EmptyMedia>
            <EmptyTitle>{members.length ? '未找到匹配成员' : '暂无成员'}</EmptyTitle>
            <EmptyDescription>
              {members.length ? '尝试调整搜索关键词，或添加新的成员' : '你可点击下方按钮添加成员'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Button type="button" onClick={() => setDialog({ type: 'add' })}>
              <UserPlus />
              添加成员
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <OrganizationAddMemberDialog
        organizationId={organizationId}
        memberIds={memberIds}
        open={dialog?.type === 'add'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      />

      <OrganizationRemoveMemberDialog
        organizationId={organizationId}
        member={dialog?.type === 'remove' ? dialog.member : null}
        open={dialog?.type === 'remove'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      />
    </div>
  )
}
