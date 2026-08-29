import { Alert, AlertDescription, AlertTitle, Badge } from '@zen/ui'

type ChangeItem = {
  id: string
  label: string
}

function ChangeGroup({
  label,
  items,
  variant = 'secondary'
}: {
  label: string
  items: ChangeItem[]
  variant?: 'secondary' | 'outline'
}) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge key={item.id} variant={variant}>
            {item.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export function AssignmentChangeSummary({
  added,
  removed,
  details
}: {
  added: ChangeItem[]
  removed: ChangeItem[]
  details?: ChangeItem[]
}) {
  const hasChanges = added.length > 0 || removed.length > 0 || (details?.length ?? 0) > 0

  if (!hasChanges) {
    return <p className="text-sm text-muted-foreground">没有变更</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <ChangeGroup label="将新增" items={added} />
      <ChangeGroup label="将移除" items={removed} variant="outline" />
      {details && details.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {details.map((item) => (
            <li key={item.id}>{item.label}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function AssignmentSessionAlert({ isSelf }: { isSelf: boolean }) {
  if (!isSelf) return null

  return (
    <Alert>
      <AlertTitle>保存后需要重新登录</AlertTitle>
      <AlertDescription>
        当前账号的会话将被注销，请重新登录后权限与数据范围才会生效。
      </AlertDescription>
    </Alert>
  )
}
