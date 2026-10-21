import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator
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

interface DictCardProps {
  item: DictionaryListItem
  onNavigateDetail: (id: string) => void
  onToggleStar: (item: DictionaryListItem) => void
  onRequestDelete: (item: DictionaryListItem) => void
}

export function DictCard({ item, onNavigateDetail, onToggleStar, onRequestDelete }: DictCardProps) {
  const isSystem = item.kind === 'system'

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/40 relative overflow-hidden flex flex-col justify-between"
      onClick={() => onNavigateDetail(item.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                isSystem
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {isSystem ? <BookLock className="size-4" /> : <Book className="size-4" />}
            </div>
            <span className="font-mono text-muted-foreground truncate text-xs font-medium tracking-wider">
              {item.code}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-70 group-hover:opacity-100"
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
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col justify-between">
        <div>
          <div className="min-w-0">
            <h3 className="text-foreground text-[15px] leading-6 font-semibold flex items-center gap-1.5 flex-wrap">
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
            </h3>
          </div>

          <p
            className={cn(
              'mt-2.5 line-clamp-2 min-h-10 text-sm leading-5',
              item.description ? 'text-muted-foreground' : 'text-muted-foreground/60 italic'
            )}
          >
            {item.description?.trim() ? item.description : '该字典没有任何描述。'}
          </p>
        </div>

        <div>
          <Separator className="mt-4 mb-2.5" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 truncate max-w-[150px]">
              <Folder className="size-3 shrink-0" />
              <span className="truncate">{item.folderName || '未归类空间'}</span>
            </span>
            <span className="tabular-nums font-mono">{item.itemCount} 项</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
