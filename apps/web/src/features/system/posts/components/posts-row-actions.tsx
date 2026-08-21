import { PermissionCode } from '@zen/shared'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@zen/ui'
import { Ban, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Can } from '@/components/auth/can'

import { usePosts } from '../posts-provider'

import type { JobProfile } from '@zen/shared'

type PostsRowActionsProps = {
  item: JobProfile
}

export function PostsRowActions({ item }: PostsRowActionsProps) {
  const { setOpen, setCurrentRow } = usePosts()

  const openDialog = (type: 'edit' | 'disable' | 'delete') => {
    setCurrentRow(item)
    setOpen(type)
  }

  return (
    <Can permission={PermissionCode.POST_MANAGE}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`打开${item.name}的操作`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => openDialog('edit')}>
              <Pencil />
              编辑
            </DropdownMenuItem>
            {item.status === 'active' ? (
              <DropdownMenuItem variant="destructive" onSelect={() => openDialog('disable')}>
                <Ban />
                停用
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => openDialog('delete')}>
              <Trash2 />
              删除
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </Can>
  )
}
