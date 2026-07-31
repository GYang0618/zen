import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import {
  ArrowLeftRight,
  Briefcase,
  Building2,
  ChevronsDownUp,
  ChevronsUpDown,
  Mail,
  Pencil,
  Phone,
  User
} from 'lucide-react'

import { organizationTree } from '../data'
import { useOrganizations } from '../organizations-provider'
import { OrganizationTree } from './organization-tree'

export function OrganizationsView() {
  const { setCurrentNode } = useOrganizations()

  return (
    <div className="flex gap-6">
      <div className="flex-1 flex flex-col gap-5">
        {/* <section>
          <div className="flex items-center justify-between">
            <InputGroup className="w-full h-12 rounded-xl">
              <InputGroupInput placeholder="搜索角色名称或编码" />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
          </div>
        </section> */}
        <section>
          <Card className="py-3">
            <CardHeader>
              <CardTitle>组织架构树</CardTitle>
              <CardAction>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="全部展开">
                      <ChevronsUpDown />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>全部展开</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="全部收起">
                      <ChevronsDownUp />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>全部收起</TooltipContent>
                </Tooltip>
              </CardAction>
            </CardHeader>
            <CardContent className="px-2">
              <OrganizationTree
                data={[organizationTree]}
                onSelect={(node) => setCurrentNode(node)}
              />
            </CardContent>
          </Card>
        </section>
      </div>

      <aside className="w-95 h-max p-5 xl:p-6 border border-border/60 rounded-3xl bg-muted/30 space-y-6">
        <Card className="rounded-2xl bg-background/80">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 font-bold">
                  <Building2 />
                  <h2 className="text-xl "> 耀世集团 </h2>
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <ArrowLeftRight className="size-4" /> 直属上级
                </span>
                <span className="font-medium">集团</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Briefcase className="size-4" /> 岗位数量
                </span>

                <Badge variant="secondary">56</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <User className="size-4" /> 编制成员
                </span>
                <Badge variant="secondary">126</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-background/80">
          <CardHeader>
            <CardTitle>负责人</CardTitle>
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
            <CardTitle>办公地点</CardTitle>
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
    </div>
  )
}
