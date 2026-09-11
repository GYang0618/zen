'use client'

import { UseAgentUpdate } from '@copilotkit/react-core/v2'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@zen/ui'
import { Users, UserX } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import { AITable } from '@/components/ai'
import {
  columns as defaultUsersColumns,
  UsersDialogs,
  UsersProvider
} from '@/features/system/users'

import { useChatAgent } from '../../context/chat-agent-context'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { User, UserStatus } from '@zen/shared'

export interface A2UIUserTableProps {
  title?: string
  stateKey?: string
  users?: User[]
  isLoading?: boolean
}

function A2UIUserTableContent({ props }: RendererProps<A2UIUserTableProps>) {
  const queryClient = useQueryClient()
  const { agent } = useChatAgent({
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnMessagesChanged]
  })

  const agentState = (agent?.state ?? {}) as Record<string, unknown>

  // 兼容直接传入的 props 与 A2UI 绑定的嵌套 props
  const effectiveProps: A2UIUserTableProps = useMemo(() => {
    const raw = (props ?? {}) as A2UIUserTableProps & { props?: A2UIUserTableProps }
    const nested = raw.props ?? {}
    return {
      title: raw.title ?? nested.title,
      stateKey: raw.stateKey ?? nested.stateKey,
      users: raw.users ?? nested.users,
      isLoading: raw.isLoading ?? nested.isLoading
    }
  }, [props])

  // 状态键判定优先级：
  // 1. 显式指定的 stateKey（例如 'users' 或 'inactive_users'）
  // 2. 若未显式指定，优先匹配包含有效数据的状态键
  // 3. 最终兜底使用 'users'
  const resolvedKey = useMemo(() => {
    if (effectiveProps.stateKey) return effectiveProps.stateKey
    if (Array.isArray(agentState.users) && agentState.users.length > 0) return 'users'
    if (Array.isArray(agentState.inactive_users) && agentState.inactive_users.length > 0) {
      return 'inactive_users'
    }
    if (Array.isArray(agentState.users)) return 'users'
    if (Array.isArray(agentState.inactive_users)) return 'inactive_users'
    return 'users'
  }, [effectiveProps.stateKey, agentState.users, agentState.inactive_users])

  // 状态单一信任源（SSOT）：优先读取共享的 Agent State，次选组件初始传入的 props.users
  const usersList: User[] = useMemo(() => {
    const fromState = agentState[resolvedKey]
    if (Array.isArray(fromState) && fromState.length > 0) {
      return fromState as User[]
    }
    if (Array.isArray(effectiveProps.users) && effectiveProps.users.length > 0) {
      return effectiveProps.users
    }
    if (Array.isArray(fromState)) {
      return fromState as User[]
    }
    return effectiveProps.users ?? []
  }, [agentState, resolvedKey, effectiveProps.users])

  // 监听 React Query 用户变异（如弹窗删除、状态切换），向 Agent State 同步最新变更
  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.type !== 'updated' || event.mutation.state.status !== 'success') {
        return
      }

      const mutationKey = event.mutation.options.mutationKey
      if (
        !Array.isArray(mutationKey) ||
        mutationKey[0] !== 'system' ||
        mutationKey[1] !== 'users'
      ) {
        return
      }

      const action = mutationKey[2]

      if (action === 'delete') {
        const deletedIds = (event.mutation.state.variables as { ids?: string[] })?.ids
        if (Array.isArray(deletedIds) && deletedIds.length > 0) {
          const current = (agent?.state as Record<string, unknown> | undefined)?.[resolvedKey]
          if (Array.isArray(current)) {
            const updated = (current as User[]).filter((u) => !deletedIds.includes(u.id))
            agent?.setState?.({
              ...(agent?.state ?? {}),
              [resolvedKey]: updated
            })
          }
        }
      } else if (action === 'status') {
        const variables = event.mutation.state.variables as {
          ids?: string[]
          status?: UserStatus
        }
        const { ids, status } = variables ?? {}
        if (Array.isArray(ids) && status) {
          const current = (agent?.state as Record<string, unknown> | undefined)?.[resolvedKey]
          if (Array.isArray(current)) {
            const updated =
              resolvedKey === 'inactive_users' && status === 'active'
                ? (current as User[]).filter((u) => !ids.includes(u.id))
                : (current as User[]).map((u) => (ids.includes(u.id) ? { ...u, status } : u))
            agent?.setState?.({
              ...(agent?.state ?? {}),
              [resolvedKey]: updated
            })
          }
        }
      } else if (action === 'update') {
        const updatedUser = event.mutation.state.data as User | undefined
        const variables = event.mutation.state.variables as
          | { id?: string; data?: Partial<User> }
          | undefined
        const targetId = variables?.id ?? updatedUser?.id
        if (targetId) {
          const current = (agent?.state as Record<string, unknown> | undefined)?.[resolvedKey]
          if (Array.isArray(current)) {
            const updated = (current as User[]).map((u) => {
              if (u.id !== targetId) return u
              return {
                ...u,
                ...(updatedUser ?? {}),
                ...(variables?.data ?? {}),
                updatedAt: new Date().toISOString()
              }
            })
            agent?.setState?.({
              ...(agent?.state ?? {}),
              [resolvedKey]: updated
            })
          }
        }
      }
    })

    return unsubscribe
  }, [queryClient, agent, resolvedKey])

  // 优先复用 users 模块的表格列配置，过滤掉只适用于主表批量操作的 select 勾选列
  const columns = useMemo(() => defaultUsersColumns.filter((col) => col.id !== 'select'), [])

  const isInactiveTable = resolvedKey === 'inactive_users'
  const titleText = effectiveProps.title || (isInactiveTable ? '已停用用户列表' : '用户列表')

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3 my-2">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-7 items-center justify-center rounded-md ${
              isInactiveTable ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            }`}
          >
            {isInactiveTable ? <UserX className="size-4" /> : <Users className="size-4" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{titleText}</h4>
            <p className="text-xs text-muted-foreground">
              由 Agent 状态实时共享驱动，共 {usersList.length} 项
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-normal">
          A2UI 声明式组件
        </Badge>
      </div>

      <AITable
        data={usersList}
        columns={columns}
        isLoading={effectiveProps.isLoading}
        emptyMessage="当前列表中暂无用户"
      />

      <UsersDialogs />
    </div>
  )
}

export function A2UIUserTable(
  rendererProps: Partial<RendererProps<A2UIUserTableProps>> & { props: A2UIUserTableProps }
) {
  return (
    <UsersProvider>
      <A2UIUserTableContent {...(rendererProps as RendererProps<A2UIUserTableProps>)} />
    </UsersProvider>
  )
}
