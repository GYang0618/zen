import { PermissionCode } from '@zen/shared'
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@zen/ui'
import { Ban, CheckSquare, MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'

import { usePosts } from '../posts-provider'
import { useUpdateJobProfilesStatusMutation } from '../queries'

import type { JobProfile } from '@zen/shared'
import type { ListSelectionActionProps } from '@/hooks'

type PostsRowActionsProps = ListSelectionActionProps & {
  item: JobProfile
}

export function PostsRowActions({
  item,
  isSelecting = false,
  selected = false,
  onEnterSelecting,
  onSelectedChange
}: PostsRowActionsProps) {
  const { setOpen, setCurrentRow } = usePosts()
  const { mutate: updateStatus, isPending } = useUpdateJobProfilesStatusMutation()

  const openDialog = (type: 'edit' | 'disable' | 'delete') => {
    setCurrentRow(item)
    setOpen(type)
  }

  if (isSelecting) {
    return (
      <span className="inline-flex size-8 items-center justify-center">
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelectedChange?.(!!value)}
          aria-label={`选择${item.name}`}
        />
      </span>
    )
  }

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`打开${item.name}的操作`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          {onEnterSelecting ? (
            <DropdownMenuItem onSelect={onEnterSelecting}>
              <CheckSquare />
              选择
            </DropdownMenuItem>
          ) : null}
          <Can permission={PermissionCode.POST_MANAGE}>
            <DropdownMenuItem onSelect={() => openDialog('edit')}>
              <Pencil />
              编辑
            </DropdownMenuItem>
            {item.status === 'active' ? (
              <DropdownMenuItem variant="destructive" onSelect={() => openDialog('disable')}>
                <Ban />
                停用
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                disabled={isPending}
                onSelect={() => {
                  updateStatus(
                    { ids: [item.id], status: 'active' },
                    {
                      onSuccess: () => toast.success('岗位已启用'),
                      onError: (error) =>
                        toast.error(error instanceof Error ? error.message : '启用失败')
                    }
                  )
                }}
              >
                <Power />
                启用
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => openDialog('delete')}>
              <Trash2 />
              删除
            </DropdownMenuItem>
          </Can>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (onEnterSelecting) return menu

  return <Can permission={PermissionCode.POST_MANAGE}>{menu}</Can>
}
