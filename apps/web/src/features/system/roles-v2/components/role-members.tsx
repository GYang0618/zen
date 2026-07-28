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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@zen/ui'
import { UserPlus } from 'lucide-react'

export function RoleMembers() {
  const people = [
    {
      username: '缪白',
      avatar: 'https://github.com/shadcn.png',
      email: 'miubai@vercel.com'
    },
    {
      username: '缪白',
      avatar: 'https://github.com/shadcn.png',
      email: 'miubai@vercel.com'
    },

    {
      username: '缪白',
      avatar: 'https://github.com/shadcn.png',
      email: 'miubai@vercel.com'
    }
  ]

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>已绑定的用户列表</CardTitle>
        <CardDescription>
          关联用户将实时继承「超级管理员」的功能权限与数据边界（当前 1 人）
        </CardDescription>
        <CardAction>
          <Button>
            <UserPlus /> 添加人员
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <ItemGroup>
          {people.map((person) => (
            <Item key={person.username} variant="outline" className="rounded-2xl">
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
                  <span className="text-xs text-muted-foreground">绑定时间: 2026/04/27</span>
                  <Button variant="destructive">解绑</Button>
                </div>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
