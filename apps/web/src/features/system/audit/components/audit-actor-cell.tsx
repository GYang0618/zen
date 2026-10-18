import { Avatar, AvatarFallback, AvatarImage, Badge } from '@zen/ui'
import { Bot, Terminal, User } from 'lucide-react'

import type { AuditActorDetail } from '../api'

interface AuditActorCellProps {
  actor?: AuditActorDetail | null
  actorType?: 'user' | 'agent' | 'system' | 'anonymous' | string
  actorName?: string | null
  actorDisplay?: string | null
  agentRunId?: string | null
  agentToolName?: string | null
  identifier?: string | null
  className?: string
}

export function AuditActorCell({
  actor,
  actorType,
  actorName,
  actorDisplay,
  agentRunId,
  agentToolName,
  identifier,
  className
}: AuditActorCellProps) {
  const normalizedType = actorType?.toLowerCase()
  const isAgent = normalizedType === 'agent' || Boolean(agentRunId)
  const isSystem = normalizedType === 'system'
  const isAnonymous = normalizedType === 'anonymous'

  // 主体名称：优先真实姓名 -> 昵称 -> 用户名 -> 传入的 actorName -> identifier -> 兜底
  const name =
    actor?.realName ||
    actor?.nickname ||
    actor?.username ||
    actorName ||
    identifier ||
    actorDisplay ||
    (isSystem ? '系统内核' : isAnonymous ? '匿名访客' : isAgent ? '智能助手' : '未知用户')

  // 账号文本：例如 @sun.qi
  const username =
    actor?.username ||
    identifier ||
    (isAgent && agentRunId ? agentRunId.slice(0, 10) : undefined) ||
    (isSystem ? 'system' : isAnonymous ? 'anonymous' : 'user')

  const fallbackText = isAgent
    ? 'AI'
    : isSystem
      ? 'SYS'
      : isAnonymous
        ? '访客'
        : name.slice(0, 1) || 'U'

  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      {isAgent && !actor ? (
        <Avatar className="size-9 border border-purple-500/20 bg-purple-500/10">
          <AvatarFallback className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Bot className="size-4" />
          </AvatarFallback>
        </Avatar>
      ) : isSystem ? (
        <Avatar className="size-9 border border-blue-500/20 bg-blue-500/10">
          <AvatarFallback className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Terminal className="size-4" />
          </AvatarFallback>
        </Avatar>
      ) : isAnonymous ? (
        <Avatar className="size-9 border bg-muted">
          <AvatarFallback className="text-muted-foreground">
            <User className="size-4" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="size-9">
          <AvatarImage src={actor?.avatar ?? undefined} alt={name} />
          <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
      )}

      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1.5 truncate">
          <span className="truncate text-sm font-medium text-foreground">{name}</span>
          {isAgent && (
            <Badge
              variant="secondary"
              className="h-4.5 gap-0.5 border-purple-500/30 px-1.5 py-0 text-xs font-medium text-purple-600 dark:text-purple-400"
            >
              Agent
            </Badge>
          )}
        </span>
        <span className="truncate font-mono text-xs text-muted-foreground">
          @{username}
          {agentToolName && (
            <span className="ml-1 text-purple-600/80 dark:text-purple-400/80">
              · {agentToolName}
            </span>
          )}
        </span>
      </span>
    </div>
  )
}
