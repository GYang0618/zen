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
import { Copy, MoreHorizontal, Pencil, Search, ShieldCheck, Trash } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useState } from 'react'
import { toast } from 'sonner'

import { FacetedFilter } from '@/components/faceted-filter'

import { getRoleIconColorClassName, roleStatusConfig, roleStatusOptions } from '../data/data'
import { useRoles } from '../roles-provider'

import type { Role } from '../type'

export function RolesList({ data }: { data: Role[] }) {
  const { setOpen, setCurrentRow, activateRole } = useRoles()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<Role['status'][]>([])

  const normalizedKeyword = keyword.trim().toLowerCase()

  const filteredData = data.filter((item) => {
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(item.status)
    const matchesKeyword =
      normalizedKeyword.length === 0 ||
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.code.toLowerCase().includes(normalizedKeyword)

    return matchesStatus && matchesKeyword
  })

  const openDialog = (type: 'edit' | 'delete' | 'clone', role: Role) => {
    setCurrentRow(role)
    setOpen(type)
  }

  const handleActivate = (role: Role) => {
    const activated = activateRole(role.id)
    if (!activated) {
      toast.error('仅已冻结的角色可以激活')
      return
    }
    toast.success(`已激活角色「${activated.name}」`)
  }

  return (
    <>
      <section className="flex  gap-4">
        <InputGroup className=" w-100">
          <InputGroupInput
            placeholder="搜索角色名称或编码"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <FacetedFilter
          options={roleStatusOptions}
          value={statusFilter}
          onValueChange={(values) => setStatusFilter(values as Role['status'][])}
        />
      </section>
      <section className="@container">
        <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
          {filteredData.map((item) => (
            <Card key={item.id} className="rounded-2xl">
              <CardHeader>
                <div className="flex gap-3">
                  <Link
                    to="/system/roles-v2/$id"
                    params={{ id: item.id }}
                    className="flex flex-1 gap-3"
                  >
                    <div
                      className={cn(
                        'flex size-12 items-center justify-center rounded-full',
                        getRoleIconColorClassName(item.iconColor)
                      )}
                    >
                      <DynamicIcon name={item.icon ?? 'shield'} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-foreground text-sm font-semibold flex items-center gap-2">
                        {item.name}
                        <Badge className={cn('border', roleStatusConfig[item.status].className)}>
                          {roleStatusConfig[item.status].label}
                        </Badge>
                      </h2>
                      <div className="text-xs text-muted-foreground mt-1">{item.code}</div>
                      <div className="mt-1 ">
                        <Badge variant="secondary">
                          {item.expiredAt ? `过期时间：${item.expiredAt}` : '长期有效'}
                        </Badge>
                      </div>
                    </div>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`${item.name} 更多操作`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4}>
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => openDialog('edit', item)}>
                          <Pencil /> 编辑信息
                        </DropdownMenuItem>
                        {item.status === 'inactive' ? (
                          <DropdownMenuItem onClick={() => handleActivate(item)}>
                            <ShieldCheck /> 激活角色
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem onClick={() => openDialog('clone', item)}>
                          <Copy /> 克隆角色
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => openDialog('delete', item)}
                      >
                        <Trash /> 删除角色
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm leading-5">
                  {item.description || '该角色没有任何描述'}
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
        </div>
      </section>
    </>
  )
}
