import { Link } from '@tanstack/react-router'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@zen/ui'
import { Copy, MoreHorizontal, Pencil, Search, Shield, ShieldCheck, Trash } from 'lucide-react'

import { FacetedFilter } from '@/components/faceted-filter'

import type { Role } from '@zen/shared'

export function RolesList({ data }: { data: Role[] }) {
  const statusOptions = [
    { label: '已激活', value: 'active' },
    { label: '已禁用', value: 'disabled' }
  ]

  return (
    <>
      <section className="flex  gap-4">
        <InputGroup className=" w-100">
          <InputGroupInput placeholder="搜索角色名称或编码" />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <FacetedFilter options={statusOptions} />
      </section>
      <section className="flex gap-4">
        {data.map((item) => (
          <Card key={item.code} className="w-85 rounded-2xl ">
            <CardHeader>
              <div className="flex gap-3">
                <Link to="/system/roles-v2/$id" params={{ id: '1' }} className="flex flex-1 gap-3">
                  <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Shield className="text-slate-500 dark:text-slate-50" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-foreground text-sm font-medium flex items-center gap-2">
                      {item.name}
                    </h2>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      {item.code}
                      <Badge
                        className={cn(
                          'border',
                          item.status === 'active'
                            ? ' border-green-700/20 bg-green-50 text-green-700 dark:border-green-700/60 dark:bg-green-950 dark:text-green-300'
                            : ' border-red-700/20 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950 dark:text-red-300'
                        )}
                      >
                        {item.status === 'active' ? '激活' : '禁用'}
                      </Badge>
                    </div>
                  </div>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={4}>
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <Pencil /> 编辑信息
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ShieldCheck /> 激活角色
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy /> 克隆策略
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <Trash /> 删除角色
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm leading-5">
                {item.description}
              </p>
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                  <ShieldCheck className="size-3.5" />
                  <span>{item.permissions.length} 项权限</span>
                </div>
                <AvatarGroup>
                  <Avatar size="sm">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Avatar size="sm">
                    <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
                    <AvatarFallback>LR</AvatarFallback>
                  </Avatar>
                  <Avatar size="sm">
                    <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
                    <AvatarFallback>ER</AvatarFallback>
                  </Avatar>
                  <AvatarGroupCount>+{item.memberCount - 3}</AvatarGroupCount>
                </AvatarGroup>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  )
}
