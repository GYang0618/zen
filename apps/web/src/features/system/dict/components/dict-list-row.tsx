import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '@zen/ui'
import {
  Book,
  BookLock,
  ExternalLink,
  Folder,
  MoreHorizontal,
  Star,
  StarOff,
  Trash2
} from 'lucide-react'

import type { DictionaryListItem } from '@zen/shared'

interface DictListRowProps {
  item: DictionaryListItem
  onNavigateDetail: (id: string) => void
  onToggleStar: (item: DictionaryListItem) => void
  onRequestDelete: (item: DictionaryListItem) => void
}

export function DictListRow({
  item,
  onNavigateDetail,
  onToggleStar,
  onRequestDelete
}: DictListRowProps) {
  const isSystem = item.kind === 'system'

  return (
    <Item
      className="group cursor-pointer rounded-lg border border-transparent px-3 py-2.5 hover:bg-muted/60 transition-colors"
      onClick={() => onNavigateDetail(item.id)}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg mr-2',
          isSystem
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            : 'bg-primary/10 text-primary'
        )}
      >
        {isSystem ? <BookLock className="size-4" /> : <Book className="size-4" />}
      </div>

      <ItemContent className="min-w-0 pr-4">
        <ItemTitle className="text-sm font-semibold flex items-center gap-2 flex-wrap">
          {item.isStarred && <Star className="size-4 text-amber-400 fill-amber-400 shrink-0" />}
          <span className="truncate">{item.name}</span>
          <Badge
            variant="outline"
            className={cn(
              'text-[11px] font-normal px-1.5 py-0 border',
              isSystem
                ? 'bg-muted/60 text-muted-foreground border-muted'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            )}
          >
            {isSystem ? '系统' : '业务'}
          </Badge>
        </ItemTitle>

        <ItemDescription className="flex items-center gap-2 text-xs truncate mt-0.5">
          <span className="font-mono text-muted-foreground">{item.code}</span>
          <span>•</span>
          <span
            className={cn(
              'truncate max-w-[420px]',
              item.description ? 'text-muted-foreground' : 'text-muted-foreground/60 italic'
            )}
          >
            {item.description?.trim() ? item.description : '该字典没有任何描述。'}
          </span>
        </ItemDescription>
      </ItemContent>

      <ItemActions className="gap-3 shrink-0">
        <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <Folder className="size-3" />
          <span className="truncate max-w-[120px]">{item.folderName || '未归类'}</span>
        </span>
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          {item.itemCount} 项
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onNavigateDetail(item.id)}>
              <ExternalLink className="size-4 mr-2" />
              详情
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStar(item)}>
              {item.isStarred ? (
                <>
                  <StarOff className="size-4 mr-2 text-muted-foreground" />
                  取消收藏
                </>
              ) : (
                <>
                  <Star className="size-4 mr-2 text-amber-500 fill-amber-500" />
                  收藏字典
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onRequestDelete(item)}
            >
              <Trash2 className="size-4 mr-2" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  )
}
