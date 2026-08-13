import { Link } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
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
  InputGroupInput,
  Skeleton
} from '@zen/ui'
import { Copy, MoreHorizontal, Pencil, Search, ShieldCheck, Trash } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { FacetedFilter } from '@/components/faceted-filter'
import { useUpdateRoleMutation } from '@/features/system/roles-v2/mutations'
import { useRolesQuery } from '@/features/system/roles-v2/queries'

import {
  getRoleIconColorClassName,
  roleEffectiveStatusConfig,
  roleEffectiveStatusOptions
} from '../data/data'
import { useRoles } from '../roles-provider'

import type { Role, RoleEffectiveStatus, RoleIcon } from '@zen/shared'

export function RolesList() {
  const { setOpen, setCurrentRow } = useRoles()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<RoleEffectiveStatus[]>([])
  const { mutate: updateRole } = useUpdateRoleMutation()

  const query = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      keyword: keyword.trim() || undefined,
      effectiveStatus: statusFilter.length > 0 ? statusFilter : undefined
    }),
    [keyword, statusFilter]
  )

  const { data, isLoading, isError } = useRolesQuery(query)
  const roles = data?.items ?? []

  const openDialog = (type: 'edit' | 'delete' | 'clone', role: Role) => {
    setCurrentRow(role)
    setOpen(type)
  }

  const handleActivate = (role: Role) => {
    if (role.effectiveStatus !== 'disabled') {
      toast.error('仅已冻结的角色可以激活')
      return
    }
    updateRole(
      { id: role.id, data: { status: 'active' } },
      {
        onSuccess: () => toast.success(`已激活角色「${role.name}」`)
      }
    )
  }

  return (
    <>
      <section className="flex gap-4">
        <InputGroup className="w-100">
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
          options={roleEffectiveStatusOptions}
          value={statusFilter}
          onValueChange={(values) => setStatusFilter(values as RoleEffectiveStatus[])}
        />
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {isError ? <p className="text-sm text-destructive">角色列表加载失败</p> : null}

      <section className="@container">
        <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
          {roles.map((item) => (
            <Card key={item.id} className="rounded-2xl">
              <CardHeader>
                <div className="flex gap-3">
                  <Link
                    to="/system/roles/$id"
                    params={{ id: item.id }}
                    className="flex flex-1 gap-3"
                  >
                    <div
                      className={cn(
                        'flex size-12 items-center justify-center rounded-full',
                        getRoleIconColorClassName(item.iconColor)
                      )}
                    >
                      <DynamicIcon name={(item.icon as RoleIcon | null) ?? 'shield'} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                        {item.name}
                        <Badge
                          className={cn(
                            'border',
                            roleEffectiveStatusConfig[item.effectiveStatus].className
                          )}
                        >
                          {roleEffectiveStatusConfig[item.effectiveStatus].label}
                        </Badge>
                      </h2>
                      <div className="mt-1 text-xs text-muted-foreground">{item.code}</div>
                      <div className="mt-1">
                        <Badge variant="secondary">
                          {item.expiresAt ? `过期时间：${item.expiresAt.slice(0, 10)}` : '长期有效'}
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
                        <Can permission={PermissionCode.ROLE_UPDATE}>
                          <DropdownMenuItem onClick={() => openDialog('edit', item)}>
                            <Pencil /> 编辑信息
                          </DropdownMenuItem>
                        </Can>
                        <Can permission={PermissionCode.ROLE_UPDATE}>
                          {item.effectiveStatus === 'disabled' ? (
                            <DropdownMenuItem onClick={() => handleActivate(item)}>
                              <ShieldCheck /> 激活角色
                            </DropdownMenuItem>
                          ) : null}
                        </Can>
                        <Can permission={PermissionCode.ROLE_CREATE}>
                          {!item.isSystem ? (
                            <DropdownMenuItem onClick={() => openDialog('clone', item)}>
                              <Copy /> 克隆角色
                            </DropdownMenuItem>
                          ) : null}
                        </Can>
                      </DropdownMenuGroup>
                      <Can permission={PermissionCode.ROLE_DELETE}>
                        {!item.isSystem ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => openDialog('delete', item)}
                            >
                              <Trash /> 删除角色
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </Can>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="min-h-10 line-clamp-2 text-sm leading-5 text-muted-foreground">
                  {item.description || '该角色没有任何描述'}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                    <ShieldCheck className="size-3.5" />
                    <span>{item.permissionCount} 项权限</span>
                  </div>
                  <AvatarGroup>
                    {item.memberPreview.map((member) => (
                      <Avatar key={member.id} size="sm">
                        {member.avatar ? <AvatarImage src={member.avatar} alt="" /> : null}
                        <AvatarFallback>{(member.nickname ?? '?').slice(0, 1)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {item.memberCount > item.memberPreview.length ? (
                      <AvatarGroupCount>
                        +{item.memberCount - item.memberPreview.length}
                      </AvatarGroupCount>
                    ) : null}
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
