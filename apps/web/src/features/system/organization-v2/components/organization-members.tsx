import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardFooter,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Separator
} from '@zen/ui'
import { CheckCircle, Mail, Phone, UserRoundArrowLeft } from 'lucide-react'

import type { OrganizationMember } from '../type'

export function OrganizationMembers({ data }: { data: OrganizationMember[] }) {
  return data.length ? (
    <div className="@container">
      <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
        {data.map((item) => (
          <Card key={item.id} className="rounded-2xl bg-background/80">
            <CardContent>
              <div className="flex flex-col justify-center items-center gap-3">
                <Avatar className="size-14">
                  <AvatarImage src={item.avatar} />
                  <AvatarFallback>{item.nickname.charAt(0)}</AvatarFallback>
                  <AvatarBadge className="bg-green-600 dark:bg-green-800" />
                </Avatar>

                <div className="text-center">
                  <h3 className="truncate text-sm font-semibold dark:text-zinc-100">
                    {item.nickname}
                  </h3>
                  <p className="text-muted-foreground mt-1 truncate text-xs dark:text-zinc-400">
                    {item.post} · {item.level}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full">
                    成员
                  </div>
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs dark:text-zinc-400">
                    <CheckCircle className="size-3.5 text-green-500" />
                    Available
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-0 bg-transparent">
              <div className="flex-1 px-3 py-2.5 flex justify-center items-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer">
                <Mail className="size-4" />
                <span>邮箱</span>
              </div>
              <Separator orientation="vertical" className="h-full" />
              <div className="flex-1 px-3 py-2.5 flex justify-center items-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer">
                <Phone className="size-4" />
                <span>电话</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  ) : (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UserRoundArrowLeft />
        </EmptyMedia>
        <EmptyTitle>暂无成员</EmptyTitle>
        <EmptyDescription>你可点击下方按钮添加成员</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button>添加成员</Button>
      </EmptyContent>
    </Empty>
  )
}
