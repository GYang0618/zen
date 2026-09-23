import { Badge, Button, Input } from '@zen/ui'
import { RotateCcw, Search } from 'lucide-react'
import { toast } from 'sonner'

import { usePetsStore } from '../stores/use-pets-store'

interface PetsHeaderProps {
  totalCount: number
  customizedCount: number
}

export function PetsHeader({ totalCount, customizedCount }: PetsHeaderProps) {
  const searchQuery = usePetsStore((s) => s.searchQuery)
  const setSearchQuery = usePetsStore((s) => s.setSearchQuery)
  const resetAll = usePetsStore((s) => s.resetAll)

  const handleResetAll = () => {
    resetAll()
    toast.success('已恢复全部宠物的默认预设')
  }

  return (
    <div className="flex flex-col gap-4 border-b border-border/60 pb-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
      {/* 标题与副标题 */}
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 font-bold text-primary shadow-xs">
          AI
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              宠物中心
            </h1>
            <Badge
              variant="outline"
              className="font-mono text-xs text-primary border-primary/30 bg-primary/5"
            >
              {totalCount} ICONS
            </Badge>
            {customizedCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {customizedCount} 只已调配
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            极简纯净球团 · 真实人眼透视 · 动态换色适配
          </p>
        </div>
      </div>

      {/* 搜索与全局快捷按钮 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索宠物名称、代号..."
            className="h-9 pl-8 text-xs rounded-xl"
          />
        </div>

        {/* 恢复全部 */}
        {customizedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            className="gap-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            <span>重置全部</span>
          </Button>
        )}
      </div>
    </div>
  )
}
