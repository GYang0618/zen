import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  VirtualList
} from '@zen/ui'
import { Search, SearchX, X } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { lucideIconEntries } from '../data/lucide-icons'

import type { LucideIconEntry } from '../data/lucide-icons'

/** 与 `Button className="size-11"` / 原 `minmax(2.75rem, 1fr)` 对齐 */
const ICON_CELL_SIZE = 44
const ICON_GRID_GAP = 4

function filterIcons(keyword: string): LucideIconEntry[] {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) return lucideIconEntries

  return lucideIconEntries.filter(
    (item) => item.name.toLowerCase().includes(normalized) || item.kebabName.includes(normalized)
  )
}

async function copyIconName(entry: LucideIconEntry) {
  try {
    await navigator.clipboard.writeText(entry.kebabName)
    toast.success(`已复制 ${entry.kebabName}`)
  } catch {
    toast.error('复制失败，请手动选择名称')
  }
}

function IconGridCell({ entry }: { entry: LucideIconEntry }) {
  return (
    <div className="flex size-full items-center justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="size-11"
            aria-label={`复制图标名称 ${entry.kebabName}`}
            onClick={() => void copyIconName(entry)}
          >
            <entry.Icon aria-hidden className="size-5 shrink-0" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{entry.kebabName}</TooltipContent>
      </Tooltip>
    </div>
  )
}

export function LucideIconsBrowser() {
  const [keyword, setKeyword] = useState('')
  const deferredKeyword = useDeferredValue(keyword)
  const filteredIcons = useMemo(() => filterIcons(deferredKeyword), [deferredKeyword])
  const isFiltering = deferredKeyword.trim().length > 0

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <section className="flex flex-wrap items-center gap-3">
        <InputGroup className="max-w-md">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索图标名称，如 activity / a-arrow-down"
            aria-label="搜索 Lucide 图标"
          />
          {keyword ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                aria-label="清空搜索"
                onClick={() => setKeyword('')}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>

        <p className="text-sm text-muted-foreground">
          {isFiltering
            ? `找到 ${filteredIcons.length} / ${lucideIconEntries.length} 个图标`
            : `共 ${lucideIconEntries.length} 个图标`}
        </p>
      </section>

      <TooltipProvider delayDuration={200}>
        <VirtualList
          key={deferredKeyword}
          items={filteredIcons}
          estimateSize={ICON_CELL_SIZE}
          minLaneSize={ICON_CELL_SIZE}
          gap={ICON_GRID_GAP}
          measure={false}
          getItemKey={(entry) => entry.name}
          className="min-h-0 flex-1"
          aria-label="Lucide 图标"
          empty={
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>未找到匹配图标</EmptyTitle>
                <EmptyDescription>试试更短的关键词，或清空搜索查看全部图标。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
        >
          {(entry) => <IconGridCell entry={entry} />}
        </VirtualList>
      </TooltipProvider>
    </div>
  )
}
