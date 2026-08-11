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
  TooltipTrigger
} from '@zen/ui'
import { Search, SearchX, X } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { toast } from 'sonner'

import { lucideIconEntries } from '../data/lucide-icons'

import type { LucideIconEntry } from '../data/lucide-icons'

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

export function LucideIconsBrowser() {
  const [keyword, setKeyword] = useState('')
  const deferredKeyword = useDeferredValue(keyword)
  const filteredIcons = filterIcons(deferredKeyword)
  const isFiltering = deferredKeyword.trim().length > 0

  return (
    <div className="flex flex-1 flex-col gap-4">
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

      {filteredIcons.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>未找到匹配图标</EmptyTitle>
            <EmptyDescription>试试更短的关键词，或清空搜索查看全部图标。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <TooltipProvider delayDuration={200}>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1 ">
            {filteredIcons.map((entry) => (
              <li key={entry.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* <button
                      type="button"
                      onClick={() => void copyIconName(entry)}
                      aria-label={`复制图标名称 ${entry.kebabName}`}
                      className="flex size-11 items-center justify-center rounded-xl border border-transparent bg-card transition-colors hover:border-border hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <entry.Icon className="size-5 shrink-0" aria-hidden />
                    </button> */}
                    <Button
                      variant="ghost"
                      className="size-11"
                      onClick={() => void copyIconName(entry)}
                    >
                      <entry.Icon aria-hidden className="size-5 shrink-0" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{entry.kebabName}</TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        </TooltipProvider>
      )}
    </div>
  )
}
