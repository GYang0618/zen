import { formatFromNow, PermissionCode, POSITION_MEMBER_PREVIEW_LIMIT } from '@zen/shared'
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
  Checkbox,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  Progress,
  Separator
} from '@zen/ui'
import {
  CalendarDays,
  CheckSquare,
  MoreHorizontal,
  PanelsTopLeft,
  ShieldCheck,
  Unlink
} from 'lucide-react'

import { Can } from '@/components/auth/can'
import { enterSelectingCurrentItem, toggleListItemFromCardClick } from '@/hooks'

import { formatPositionLevel } from '../utils'

import type { ListSelectionActionProps } from '@/hooks'
import type { Position } from '../type'

type OrganizationPositionCardProps = Pick<
  ListSelectionActionProps,
  'isSelecting' | 'selected' | 'onSelectedChange'
> & {
  position: Position
  onUnlink: () => void
  onEditRoles: () => void
}

export function OrganizationPositionCard({
  position,
  isSelecting = false,
  selected = false,
  onSelectedChange,
  onUnlink,
  onEditRoles
}: OrganizationPositionCardProps) {
  const vacancy = Math.max(position.headcount - position.activeCount, 0)
  const fillRate =
    position.headcount > 0 ? Math.round((position.activeCount / position.headcount) * 100) : 0
  const previewMembers = (position.memberPreview ?? []).slice(0, POSITION_MEMBER_PREVIEW_LIMIT)
  const overflowCount = Math.max(position.activeCount - previewMembers.length, 0)

  return (
    <Card
      className={cn(
        'gap-3',
        isSelecting && 'cursor-pointer select-none',
        selected && 'ring-2 ring-primary ring-offset-1'
      )}
      onClick={(event) =>
        toggleListItemFromCardClick(event, { isSelecting, selected, onSelectedChange })
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted-foreground/10">
              <PanelsTopLeft className="size-4" />
            </div>
            <span className="truncate text-xs">{position.code}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant="outline">{vacancy > 0 ? '有空缺' : '已满编'}</Badge>
            {isSelecting ? (
              <span className="inline-flex size-8 items-center justify-center">
                <Checkbox
                  checked={selected}
                  onCheckedChange={(value) => onSelectedChange?.(!!value)}
                  aria-label={`选择${position.name}`}
                />
              </span>
            ) : (
              <Can permission={PermissionCode.POST_MANAGE}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`打开${position.name}的操作`}
                      />
                    }
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => enterSelectingCurrentItem({ onSelectedChange })}
                      >
                        <CheckSquare />
                        选择
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onEditRoles}>
                        <ShieldCheck className="size-4" />
                        配置基准角色
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={onUnlink}>
                        <Unlink />
                        取消关联
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Can>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h2 className="text-base font-semibold">{position.name}</h2>
        <p className="mt-1 text-muted-foreground">{formatPositionLevel(position.level)}</p>
        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {position.description || '暂无描述'}
        </p>
        {position.roles && position.roles.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <ShieldCheck className="size-3 text-primary" />
              基准角色:
            </span>
            {position.roles.map((role) => (
              <Badge key={role.id} variant="secondary" className="h-4 px-1.5 py-0 text-[10px]">
                {role.name}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-2 flex min-h-8 items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-muted-foreground" title="最后更新时间">
            <CalendarDays className="size-4" aria-hidden />
            {formatFromNow(position.updatedAt)}
          </span>
          {previewMembers.length > 0 ? (
            <AvatarGroup>
              {previewMembers.map((member) => (
                <Avatar key={member.id} size="sm" title={member.name}>
                  {member.avatar ? <AvatarImage src={member.avatar} alt={member.name} /> : null}
                  <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
              ))}
              {overflowCount > 0 ? (
                <AvatarGroupCount title={`另有 ${overflowCount} 人`}>
                  +{overflowCount}
                </AvatarGroupCount>
              ) : null}
            </AvatarGroup>
          ) : null}
        </div>
        <Separator className="mt-4 mb-3" />
        <Field>
          <FieldLabel>
            <span className="text-sm">{fillRate}%</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {position.activeCount}/{position.headcount} 在岗 · {vacancy} 空缺
            </span>
          </FieldLabel>
          <Progress value={fillRate} />
        </Field>
      </CardContent>
    </Card>
  )
}
