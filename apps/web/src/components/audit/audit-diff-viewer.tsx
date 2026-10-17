import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zen/ui'
import { ArrowRight, CheckCircle2, ShieldAlert, UserMinus, UserPlus } from 'lucide-react'

import type { AuditDiff, AuditDiffChange } from '@zen/shared'

function isAuditDiff(value: unknown): value is AuditDiff {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    'changes' in candidate ||
    'members' in candidate ||
    'permissions' in candidate ||
    'target' in candidate ||
    'summary' in candidate ||
    'meta' in candidate
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

interface AuditDiffViewerProps {
  diff: unknown
  className?: string
}

export function AuditDiffViewer({ diff, className }: AuditDiffViewerProps) {
  if (!diff) {
    return <p className="text-sm text-muted-foreground">无详细快照</p>
  }

  if (!isAuditDiff(diff)) {
    return (
      <div className={className}>
        <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground">
          {JSON.stringify(diff, null, 2)}
        </pre>
      </div>
    )
  }

  const { changes, members, permissions, query, sensitive, denied, meta, summary } = diff

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {summary && (
        <div className="rounded-md bg-muted/60 p-3 text-sm text-foreground">
          <span className="font-medium">摘要：</span>
          {summary}
        </div>
      )}

      {/* 字段变更对比表 */}
      {changes && changes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            字段变更明细 ({changes.length})
          </h4>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">字段</TableHead>
                  <TableHead>变更前</TableHead>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>变更后</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.map((change: AuditDiffChange, index: number) => (
                  <TableRow key={change.field || index}>
                    <TableCell className="font-medium text-foreground">
                      {change.label || change.field}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                        {formatValue(change.from)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-foreground">
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                        {formatValue(change.to)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 成员变更 */}
      {members && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            成员调整
          </h4>
          <div className="flex flex-wrap gap-2">
            {members.added && members.added.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">添加：</span>
                <div className="flex flex-wrap gap-1.5">
                  {members.added.map((m, idx) => (
                    <Badge
                      key={m.id || idx}
                      variant="outline"
                      className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    >
                      <UserPlus className="h-3 w-3" />
                      {m.name || m.id}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {members.removed && members.removed.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">移除：</span>
                <div className="flex flex-wrap gap-1.5">
                  {members.removed.map((m, idx) => (
                    <Badge
                      key={m.id || idx}
                      variant="outline"
                      className="gap-1 border-destructive/30 text-destructive"
                    >
                      <UserMinus className="h-3 w-3" />
                      {m.name || m.id}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 权限调整 */}
      {permissions && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            权限变更
          </h4>
          <div className="space-y-2">
            {permissions.added && permissions.added.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">新增权限：</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {permissions.added.map((p, idx) => (
                    <Badge key={p.code || idx} variant="secondary" className="text-xs">
                      <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" />
                      {p.name || p.code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {permissions.removed && permissions.removed.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">撤销权限：</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {permissions.removed.map((p, idx) => (
                    <Badge
                      key={p.code || idx}
                      variant="outline"
                      className="text-xs text-destructive"
                    >
                      {p.name || p.code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 查询条件 */}
      {query && (
        <div className="space-y-1 rounded-md border border-border p-3 text-xs">
          <span className="font-medium text-foreground">查询条件：</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {query.filters.map((f, idx) => (
              <Badge key={idx} variant="outline">
                {f.label}: {f.value}
              </Badge>
            ))}
          </div>
          {query.count !== undefined && (
            <div className="mt-1 text-muted-foreground">匹配记录条数：{query.count}</div>
          )}
        </div>
      )}

      {/* 安全与阻断提示 */}
      {denied && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">访问已被安全策略阻断</div>
            <div>尝试操作：{denied.attempted}</div>
            {denied.missing && denied.missing.length > 0 && (
              <div>
                缺失权限：
                {denied.missing.map((m) => m.name || m.code).join('、')}
              </div>
            )}
          </div>
        </div>
      )}

      {sensitive && (
        <div className="text-xs text-muted-foreground">
          ℹ️ 本记录包含敏感数据，密码/Token 等私密信息已自动实施星号脱敏。
        </div>
      )}

      {/* 附加元数据展示 */}
      {meta && Object.keys(meta).length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            附加上下文
          </h4>
          <pre className="max-h-48 overflow-auto rounded bg-muted/50 p-2 font-mono text-xs text-foreground">
            {JSON.stringify(meta, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
