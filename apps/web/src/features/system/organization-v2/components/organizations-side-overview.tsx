import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Separator
} from '@zen/ui'
import {
  BadgeJapaneseYen,
  Briefcase,
  Building2,
  Calendar,
  FolderTree,
  IdCard,
  Mail,
  Pencil,
  Phone,
  User
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface CoreField {
  label: string
  value: string | ReactNode
  icon: LucideIcon
}
export function OrganizationSideOverview() {
  const coreFields: CoreField[] = [
    {
      label: '编码',
      value: 'ORG-0001',
      icon: IdCard
    },
    {
      label: '上级组织',
      value: '集团',
      icon: FolderTree
    },
    {
      label: '成员',
      value: 218,
      icon: User
    },
    {
      label: '岗位',
      value: 56,
      icon: Briefcase
    },
    {
      label: '成本预算',
      value: '1000000¥',
      icon: BadgeJapaneseYen
    },
    {
      label: '生效日期',
      value: '2026年08月01日',
      icon: Calendar
    }
  ]
  return (
    <aside className="h-max p-5 xl:p-6 border border-border/60 rounded-3xl bg-muted/30 space-y-6">
      <Card className="rounded-2xl bg-background/80">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 font-bold">
                <Building2 />
                <h2 className="text-xl"> 耀世集团</h2>
                <Badge variant="secondary">集团</Badge>
              </div>

              <Button variant="ghost" size="icon-sm">
                <Pencil />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>一家专注于科技创新和多元业务发展的综合性企业集团。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 bg-background/80">
          <Separator />
          <div className="space-y-3">
            {coreFields.map((field) => {
              const Icon = field.icon
              return (
                <div key={field.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Icon className="size-4" /> {field.label}
                  </span>

                  {typeof field.value === 'string' ? (
                    <span className="font-medium">{field.value}</span>
                  ) : (
                    field.value
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-background/80">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <h2>负责人</h2>
              <Button variant="ghost" size="icon-sm">
                <Pencil />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Item className="p-0 mb-5">
            <ItemMedia>
              <Avatar className="size-14">
                <AvatarImage src="https://github.com/maxleiter.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="text-xl">
                布莱克·亨特
                <span className="size-2 rounded-full bg-green-400 ml-1"></span>
              </ItemTitle>
              <ItemDescription>CEO · 执行董事长</ItemDescription>
            </ItemContent>
          </Item>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="size-4" />
              <span>13800138000</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-4" />
              <span>brent.hunter@example.com</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-background/80">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <h2>办公地点</h2>
              <Button variant="ghost" size="icon-sm">
                <Pencil />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className=" space-y-5">
          <div className="h-40 rounded-xl bg-muted"></div>
          <Separator />
          <div className="text-muted-foreground space-y-1">
            <p>江苏省南京市</p>
            <p>栖霞区仙林大道100号</p>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
