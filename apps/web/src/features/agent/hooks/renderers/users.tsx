import { useRenderTool } from '@copilotkit/react-core/v2'
import { usersQueryToolSchema } from '@zen/shared'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@zen/ui'
import { AlertCircle, LayoutGrid, TextAlignStart } from 'lucide-react'
import { z } from 'zod'

import { columns, UserCard, UsersDialogs, UsersProvider } from '@/features/system/users'

import { DataTable } from '../../generative-ui'
import { ViewSwitcher } from '../../generative-ui/components/view-switcher'
import { useAgentToolResultParse } from '../use-agent-tool-result-parse'

import type { User, UsersQueryTool } from '@zen/shared'

const compactRoleSchema = z
  .object({
    id: z.string().optional(),
    code: z.string().optional(),
    name: z.string().optional(),
    icon: z.string().nullable().optional(),
    iconColor: z.string().nullable().optional(),
    status: z.string().optional()
  })
  .passthrough()

const compactOrgSchema = z
  .object({
    id: z.string().optional(),
    organizationId: z.string().optional(),
    organizationName: z.string().optional(),
    positionName: z.string().optional(),
    isPrimary: z.boolean().optional()
  })
  .passthrough()

const userListItemSchema = z
  .object({
    id: z.coerce.string().optional(),
    username: z.coerce.string().optional(),
    email: z.coerce.string().optional(),
    nickname: z.string().nullable().optional(),
    realName: z.string().nullable().optional(),
    status: z.string().optional(),
    avatar: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
    isLocked: z.boolean().optional(),
    lastActiveAt: z.string().nullable().optional(),
    roles: z.array(compactRoleSchema).optional(),
    organizations: z.array(compactOrgSchema).optional()
  })
  .passthrough()

const userListResultSchema = z.union([
  z.object({
    items: z.array(userListItemSchema),
    total: z.number().optional(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
    totalPages: z.number().optional()
  }),
  z
    .object({
      users: z.array(userListItemSchema),
      total: z.number().optional()
    })
    .transform((val) => ({ items: val.users, total: val.total })),
  z.array(userListItemSchema)
])

function normalizeUsers(data: z.infer<typeof userListResultSchema> | undefined): User[] {
  if (!data) return []
  const rawList = Array.isArray(data) ? data : data.items
  return rawList.map((item) => ({
    id: String(item.id ?? ''),
    username: String(item.username ?? ''),
    email: String(item.email ?? ''),
    nickname: item.nickname ?? null,
    realName: item.realName ?? null,
    avatar: item.avatar ?? null,
    gender: item.gender ?? 'unknown',
    phoneNumber: item.phoneNumber ?? null,
    status: item.status ?? 'active',
    isLocked: item.isLocked ?? false,
    lockExpireAt: item.lockExpireAt ?? null,
    roles: item.roles ?? [],
    organizations: item.organizations ?? [],
    mfaEnabled: item.mfaEnabled ?? false,
    mfaType: item.mfaType ?? 'none',
    mustChangePassword: item.mustChangePassword ?? false,
    lastPasswordChange: item.lastPasswordChange ?? null,
    passwordExpireAt: item.passwordExpireAt ?? null,
    loginAttempts: item.loginAttempts ?? 0,
    lastLoginAt: item.lastLoginAt ?? null,
    lastLoginIp: item.lastLoginIp ?? null,
    lastActiveAt: item.lastActiveAt ?? null,
    activeSessionCount: item.activeSessionCount ?? 0,
    accessTokenExpiresAt: item.accessTokenExpiresAt ?? null,
    remark: item.remark ?? null,
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? new Date().toISOString()
  })) as User[]
}

interface UsersToolRenderProps {
  parameters?: Partial<UsersQueryTool>
  status: 'inProgress' | 'executing' | 'complete'
  result?: unknown
}

function UsersToolRender({ parameters, status, result }: UsersToolRenderProps) {
  const { title, description, display } = parameters ?? {}
  const isLoading = status === 'inProgress' || status === 'executing'

  // 使用统一 Hook 解包真实业务数据：仅在完成时解析，无需传入 status
  const { data, error } = useAgentToolResultParse(result, userListResultSchema)

  if (display === false) return null

  // 错误态拦截（工具执行完成但失败或校验不通过）
  if (!isLoading && error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="size-4" />
          <span>用户查询失败</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
      </div>
    )
  }

  const users = normalizeUsers(data)

  return (
    <UsersProvider>
      <UsersDialogs />
      <ViewSwitcher
        title={title ?? '用户查询结果'}
        description={description}
        views={[
          {
            key: 'card',
            icon: LayoutGrid,
            render:
              users.length === 0 && !isLoading ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  暂无用户数据
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent className="-ml-2">
                    {users.map((user) => (
                      <CarouselItem
                        key={user.id}
                        className="pl-2 basis-full sm:basis-1/2 lg:basis-1/3"
                      >
                        <div className="p-1">
                          <UserCard user={user} />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {users.length > 1 && (
                    <>
                      <CarouselPrevious className="left-1" />
                      <CarouselNext className="right-1" />
                    </>
                  )}
                </Carousel>
              )
          },
          {
            key: 'table',
            icon: TextAlignStart,
            render: (
              <DataTable
                data={users}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="暂无用户数据"
              />
            )
          }
        ]}
        loading={isLoading}
      />
    </UsersProvider>
  )
}

export function useUsersRenderers() {
  useRenderTool({
    name: 'query_users_list',
    parameters: usersQueryToolSchema,
    render: (props) => <UsersToolRender {...props} />
  })
}
