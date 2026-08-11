import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardFooter,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ScrollArea,
  Separator
} from '@zen/ui'
import { CheckCircle, Mail, Phone, Search, UserPlus, UserRoundArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { organizationUsers } from '../data/mock'

import type { OrganizationMember, OrganizationUserOption } from '../type'

function toMember(user: OrganizationUserOption): OrganizationMember {
  return {
    id: user.id,
    avatar: user.avatar,
    username: user.email.split('@')[0] ?? user.name,
    nickname: user.name,
    post: user.title,
    organization: '',
    postStatus: '在职',
    email: user.email,
    phoneNumber: user.phone,
    level: 'P6'
  }
}

function matchesMember(member: OrganizationMember, keyword: string): boolean {
  const q = keyword.trim().toLowerCase()
  if (!q) return true
  return [member.nickname, member.username, member.email, member.post, member.level, member.phoneNumber]
    .join(' ')
    .toLowerCase()
    .includes(q)
}

export function OrganizationMembers({ data }: { data: OrganizationMember[] }) {
  const [members, setMembers] = useState<OrganizationMember[]>(data)
  const [keyword, setKeyword] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addKeyword, setAddKeyword] = useState('')

  const memberKeySet = useMemo(() => {
    const keys = new Set<string>()
    for (const member of members) {
      keys.add(member.id)
      keys.add(member.email.toLowerCase())
    }
    return keys
  }, [members])

  const isUserBound = (user: OrganizationUserOption) =>
    memberKeySet.has(user.id) || memberKeySet.has(user.email.toLowerCase())

  const filteredMembers = useMemo(
    () => members.filter((member) => matchesMember(member, keyword)),
    [keyword, members]
  )

  const filteredAvailableUsers = useMemo(() => {
    const q = addKeyword.trim().toLowerCase()
    const filtered = q
      ? organizationUsers.filter(
          (user) =>
            user.name.toLowerCase().includes(q) ||
            user.email.toLowerCase().includes(q) ||
            user.title.toLowerCase().includes(q)
        )
      : organizationUsers

    return [...filtered].sort((a, b) => Number(isUserBound(a)) - Number(isUserBound(b)))
  }, [addKeyword, memberKeySet])

  const handleOpenAdd = () => {
    setAddKeyword('')
    setAddOpen(true)
  }

  const handleBindMember = (user: OrganizationUserOption) => {
    if (isUserBound(user)) return
    setMembers((prev) => [...prev, toMember(user)])
    setAddOpen(false)
    toast.success(`已添加成员「${user.name}」`)
  }

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
        <Button type="button" onClick={handleOpenAdd}>
          <UserPlus />
          添加成员
        </Button>
      </section>

      {filteredMembers.length ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
          {filteredMembers.map((item) => (
            <Card key={item.id} className="rounded-2xl bg-background/80">
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-3">
                  <Avatar className="size-14">
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback>{item.nickname.charAt(0)}</AvatarFallback>
                    <AvatarBadge className="bg-green-600 dark:bg-green-800" />
                  </Avatar>

                  <div className="text-center">
                    <h3 className="truncate text-sm font-semibold dark:text-zinc-100">
                      {item.nickname}
                    </h3>
                    <p className="mt-1 truncate text-xs text-muted-foreground dark:text-zinc-400">
                      {item.post} · {item.level}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <div className="inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      成员
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground dark:text-zinc-400">
                      <CheckCircle className="size-3.5 text-green-500" />
                      Available
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
          ))}
        </div>
      ) : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundArrowLeft />
            </EmptyMedia>
            <EmptyTitle>{members.length ? '未找到匹配成员' : '暂无成员'}</EmptyTitle>
            <EmptyDescription>
              {members.length
                ? '尝试调整搜索关键词，或添加新的成员'
                : '你可点击下方按钮添加成员'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Button type="button" onClick={handleOpenAdd}>
              <UserPlus />
              添加成员
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加成员</DialogTitle>
          </DialogHeader>

          <InputGroup>
            <InputGroupInput
              placeholder="搜索姓名/邮箱/岗位"
              value={addKeyword}
              onChange={(event) => setAddKeyword(event.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>

          <ScrollArea className="h-56 pr-2.5">
            <ItemGroup>
              {filteredAvailableUsers.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">没有匹配的用户</p>
              ) : null}

              {filteredAvailableUsers.map((user) => {
                const isBound = isUserBound(user)

                return (
                  <Item size="xs" key={user.id} variant="outline" className="rounded-2xl">
                    <ItemMedia>
                      <Avatar className="size-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </ItemMedia>

                    <ItemContent>
                      <ItemTitle>{user.name}</ItemTitle>
                      <ItemDescription>
                        {user.title} · {user.email}
                      </ItemDescription>
                    </ItemContent>

                    <ItemActions>
                      <Button
                        type="button"
                        size="sm"
                        variant={isBound ? 'outline' : 'default'}
                        disabled={isBound}
                        onClick={() => handleBindMember(user)}
                      >
                        {isBound ? '已添加' : '添加'}
                      </Button>
                    </ItemActions>
                  </Item>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
