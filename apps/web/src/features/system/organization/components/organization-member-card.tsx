import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Checkbox,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  toast
} from '@zen/ui'
import { CheckCircle, CheckSquare, Ellipsis, Mail, Phone, UserRoundMinus } from 'lucide-react'

import { enterSelectingCurrentItem, toggleListItemFromCardClick } from '@/hooks'

import type { ReactNode } from 'react'
import type { ListSelectionActionProps } from '@/hooks'
import type { OrganizationMember } from '../type'

type OrganizationMemberCardProps = Pick<
  ListSelectionActionProps,
  'isSelecting' | 'selected' | 'onSelectedChange'
> & {
  member: OrganizationMember
  onRemove: () => void
}

export function organizationMemberName(member: OrganizationMember): string {
  return member.nickname ?? member.username
}

export function organizationMemberStatusLabel(status: OrganizationMember['accountStatus']): string {
  if (status === 'active') return '已激活'
  if (status === 'pending') return '待激活'
  if (status === 'suspended') return '已停用'
  return '未激活'
}

async function copyMemberContact(
  value: string | null,
  options: { emptyMessage: string; successLabel: string }
) {
  const text = value?.trim()
  if (!text) {
    toast.add({ title: options.emptyMessage, type: 'error' })
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: `已复制${options.successLabel}：${text}`, type: 'success' })
  } catch {
    toast.add({ title: '复制失败，请手动选择', type: 'error' })
  }
}

export function OrganizationMemberCard({
  member,
  isSelecting = false,
  selected = false,
  onSelectedChange,
  onRemove
}: OrganizationMemberCardProps) {
  const name = organizationMemberName(member)

  return (
    <Card
      className={cn(
        'relative rounded-2xl bg-background/80 transition-all',
        isSelecting && 'cursor-pointer select-none',
        selected && 'ring-2 ring-primary ring-offset-1'
      )}
      onClick={(event) =>
        toggleListItemFromCardClick(event, { isSelecting, selected, onSelectedChange })
      }
    >
      <div className="absolute top-2 right-2">
        {isSelecting ? (
          <span className="inline-flex size-8 items-center justify-center">
            <Checkbox
              checked={selected}
              onCheckedChange={(value) => onSelectedChange?.(!!value)}
              aria-label={`选择${name}`}
            />
          </span>
        ) : (
          <MemberActions member={member} onSelectedChange={onSelectedChange} onRemove={onRemove} />
        )}
      </div>

      <CardContent className="pt-7">
        <div className="flex flex-col items-center justify-center gap-3">
          <Avatar className="size-14">
            <AvatarImage src={member.avatar ?? undefined} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            {member.accountStatus === 'active' ? (
              <AvatarBadge className="bg-green-600 dark:bg-green-800" />
            ) : null}
          </Avatar>

          <div className="text-center">
            <h3 className="truncate text-sm font-semibold dark:text-zinc-100">{name}</h3>
            <p className="mt-1 truncate text-xs text-muted-foreground dark:text-zinc-400">
              {[member.post, member.level].filter(Boolean).join(' · ') || '未分配岗位'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              主职
            </Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground dark:text-zinc-400">
              <CheckCircle className="size-3.5 text-green-500" />
              {organizationMemberStatusLabel(member.accountStatus)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-transparent p-0">
        <ContactButton
          label="邮箱"
          ariaLabel={`复制${name}的邮箱`}
          icon={<Mail className="size-4" />}
          isSelecting={isSelecting}
          onCopy={() =>
            void copyMemberContact(member.email, {
              emptyMessage: '该成员暂无邮箱',
              successLabel: '邮箱'
            })
          }
        />
        <Separator orientation="vertical" className="h-full" />
        <ContactButton
          label="电话"
          ariaLabel={`复制${name}的电话`}
          icon={<Phone className="size-4" />}
          isSelecting={isSelecting}
          onCopy={() =>
            void copyMemberContact(member.phoneNumber, {
              emptyMessage: '该成员暂无电话',
              successLabel: '电话'
            })
          }
        />
      </CardFooter>
    </Card>
  )
}

function MemberActions({
  member,
  onSelectedChange,
  onRemove
}: {
  member: OrganizationMember
  onSelectedChange?: (selected: boolean) => void
  onRemove: () => void
}) {
  const name = organizationMemberName(member)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`打开${name}的成员操作`}
          />
        }
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => enterSelectingCurrentItem({ onSelectedChange })}>
            <CheckSquare />
            选择
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onRemove}>
            <UserRoundMinus />
            移除成员
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ContactButton({
  label,
  ariaLabel,
  icon,
  isSelecting,
  onCopy
}: {
  label: string
  ariaLabel: string
  icon: ReactNode
  isSelecting: boolean
  onCopy: () => void
}) {
  return (
    <button
      type="button"
      className="flex flex-1 cursor-pointer items-center justify-center gap-2 border-0 bg-transparent px-3 py-2.5 text-inherit transition-colors hover:bg-muted/50"
      aria-label={ariaLabel}
      onClick={() => {
        if (isSelecting) return
        onCopy()
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
