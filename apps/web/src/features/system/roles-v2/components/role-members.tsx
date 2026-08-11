import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  ScrollArea
} from '@zen/ui'
import { Search, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'

export function RoleMembers() {
  type Member = {
    id: string
    username: string
    avatar: string
    email: string
    boundAtLabel: string
  }

  const availableMembers: Member[] = useMemo(
    () => [
      {
        id: 'm-1',
        username: 'Miubai',
        avatar: 'https://github.com/shadcn.png',
        email: 'miubai@vercel.com',
        boundAtLabel: '2026/04/27'
      },
      {
        id: 'm-2',
        username: 'Xiaoqing',
        avatar: 'https://github.com/maxleiter.png',
        email: 'xiaoqing@vercel.com',
        boundAtLabel: '2026/05/02'
      },
      {
        id: 'm-3',
        username: 'Evilrabbit',
        avatar: 'https://github.com/evilrabbit.png',
        email: 'evilrabbit@vercel.com',
        boundAtLabel: '2026/05/18'
      },
      {
        id: 'm-4',
        username: 'Linrui',
        avatar: 'https://github.com/leerob.png',
        email: 'linrui@vercel.com',
        boundAtLabel: '2026/06/01'
      },
      {
        id: 'm-5',
        username: 'Lili',
        avatar: 'https://github.com/vercel.png',
        email: 'lili@vercel.com',
        boundAtLabel: '2026/06/10'
      }
    ],
    []
  )

  const [boundMembers, setBoundMembers] = useState<Member[]>(() => [
    {
      id: 'm-1',
      username: 'Miubai',
      avatar: 'https://github.com/shadcn.png',
      email: 'miubai@vercel.com',
      boundAtLabel: '2026/04/27'
    }
  ])

  const boundIdSet = useMemo(() => new Set(boundMembers.map((m) => m.id)), [boundMembers])

  const [addOpen, setAddOpen] = useState(false)
  const [addKeyword, setAddKeyword] = useState('')

  const [unbindOpen, setUnbindOpen] = useState(false)
  const [targetUnbindId, setTargetUnbindId] = useState<string | null>(null)

  const handleOpenAdd = () => {
    setAddKeyword('')
    setAddOpen(true)
  }

  const handleOpenUnbind = (id: string) => {
    setTargetUnbindId(id)
    setUnbindOpen(true)
  }

  const handleBindMember = (id: string) => {
    if (boundIdSet.has(id)) return
    const member = availableMembers.find((m) => m.id === id)
    if (!member) return
    setBoundMembers((prev) => [...prev, member])
    setAddOpen(false)
  }

  const handleConfirmUnbind = () => {
    if (!targetUnbindId) return
    setBoundMembers((prev) => prev.filter((m) => m.id !== targetUnbindId))
    setUnbindOpen(false)
    setTargetUnbindId(null)
  }

  const targetUnbind = targetUnbindId
    ? (availableMembers.find((m) => m.id === targetUnbindId) ??
      boundMembers.find((m) => m.id === targetUnbindId))
    : null

  const filteredAvailableMembers = useMemo(() => {
    const keyword = addKeyword.trim().toLowerCase()
    const filtered = keyword
      ? availableMembers.filter(
          (member) =>
            member.username.toLowerCase().includes(keyword) ||
            member.email.toLowerCase().includes(keyword)
        )
      : availableMembers

    // 未绑定排前，已绑定排后
    return [...filtered].sort((a, b) => {
      const aBound = boundIdSet.has(a.id) ? 1 : 0
      const bBound = boundIdSet.has(b.id) ? 1 : 0
      return aBound - bBound
    })
  }, [addKeyword, availableMembers, boundIdSet])

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>已绑定的用户列表</CardTitle>
        <CardDescription>
          关联用户将实时继承「超级管理员」的功能权限与数据边界（当前 {boundMembers.length} 人）
        </CardDescription>
        <CardAction>
          <Button type="button" onClick={handleOpenAdd}>
            <UserPlus /> 添加人员
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <ItemGroup>
          {boundMembers.map((person) => (
            <Item key={person.id} variant="outline" className="rounded-2xl">
              <ItemMedia>
                <Avatar className="size-10">
                  <AvatarImage src={person.avatar} />
                  <AvatarFallback>{person.username.charAt(0)}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{person.username}</ItemTitle>
                <ItemDescription>{person.email}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">
                    绑定时间: {person.boundAtLabel}
                  </span>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleOpenUnbind(person.id)}
                  >
                    解绑
                  </Button>
                </div>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加人员</DialogTitle>
          </DialogHeader>

          <InputGroup>
            <InputGroupInput
              placeholder="搜索昵称/邮箱"
              value={addKeyword}
              onChange={(event) => setAddKeyword(event.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>

          <ScrollArea className="h-56 pr-2.5">
            <ItemGroup>
              {filteredAvailableMembers.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">没有匹配的用户</p>
              ) : null}

              {filteredAvailableMembers.map((member) => {
                const isBound = boundIdSet.has(member.id)

                return (
                  <Item size="xs" key={member.id} variant="outline" className="rounded-2xl">
                    <ItemMedia>
                      <Avatar className="size-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </ItemMedia>

                    <ItemContent>
                      <ItemTitle>{member.username}</ItemTitle>
                      <ItemDescription>{member.email}</ItemDescription>
                    </ItemContent>

                    <ItemActions>
                      <Button
                        type="button"
                        size="sm"
                        variant={isBound ? 'outline' : 'default'}
                        disabled={isBound}
                        onClick={() => handleBindMember(member.id)}
                      >
                        {isBound ? '已绑定' : '绑定'}
                      </Button>
                    </ItemActions>
                  </Item>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={unbindOpen} onOpenChange={setUnbindOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认解绑</DialogTitle>
            <DialogDescription>
              {targetUnbind
                ? `确定将「${targetUnbind.username}」从角色解绑吗？`
                : '目标用户不存在。'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUnbindOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmUnbind}
              disabled={!targetUnbindId}
            >
              确认解绑
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
