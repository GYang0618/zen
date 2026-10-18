'use no memo'

import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator
} from '@zen/ui'
import { CheckIcon, CirclePlus as PlusCircledIcon } from 'lucide-react'
import { useMemo } from 'react'

import type { Column } from '@tanstack/react-table'
import type * as React from 'react'

export type FilterOption = {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

export type FilterGroup = {
  heading?: string
  quickAction?: {
    label: string
    values: string[]
  }
  options: FilterOption[]
}

type DataTableFacetedFilterProps<TData, TValue> = {
  column?: Column<TData, TValue>
  title?: string
  options?: FilterOption[]
  groups?: FilterGroup[]
  contentClassName?: string
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  groups,
  contentClassName
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues()
  const selectedValues = new Set(column?.getFilterValue() as string[])

  const allOptions = useMemo(() => {
    if (groups && groups.length > 0) {
      return groups.flatMap((g) => g.options)
    }
    return options ?? []
  }, [groups, options])

  const effectiveGroups: FilterGroup[] = useMemo(() => {
    if (groups && groups.length > 0) return groups
    if (options && options.length > 0) return [{ options }]
    return []
  }, [groups, options])

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}>
        <PlusCircledIcon className="size-4" />
        {title}
        {selectedValues?.size > 0 && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
              {selectedValues.size}
            </Badge>
            <div className="hidden space-x-1 lg:flex">
              {selectedValues.size > 2 ? (
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  {selectedValues.size} 项
                </Badge>
              ) : (
                allOptions
                  .filter((option) => selectedValues.has(option.value))
                  .map((option) => (
                    <Badge
                      variant="secondary"
                      key={option.value}
                      className="rounded-sm px-1 font-normal"
                    >
                      {option.label}
                    </Badge>
                  ))
              )}
            </div>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className={cn('w-50 p-0', contentClassName)} align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>没有找到结果。</CommandEmpty>
            {effectiveGroups.map((group, groupIdx) => {
              const groupValues = group.options.map((opt) => opt.value)
              const allGroupSelected =
                groupValues.length > 0 && groupValues.every((val) => selectedValues.has(val))

              return (
                <div key={group.heading ?? groupIdx}>
                  {groupIdx > 0 && <CommandSeparator />}
                  <CommandGroup
                    heading={
                      group.heading || group.quickAction ? (
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>{group.heading}</span>
                          {group.quickAction && (
                            <button
                              type="button"
                              className="text-xs text-primary hover:underline font-normal cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                const targetValues = group.quickAction?.values ?? groupValues
                                const hasAll = targetValues.every((v) => selectedValues.has(v))
                                const nextSet = new Set(selectedValues)
                                if (hasAll) {
                                  for (const v of targetValues) nextSet.delete(v)
                                } else {
                                  for (const v of targetValues) nextSet.add(v)
                                }
                                const res = Array.from(nextSet)
                                column?.setFilterValue(res.length ? res : undefined)
                              }}
                            >
                              {allGroupSelected
                                ? `取消${group.quickAction.label}`
                                : `仅${group.quickAction.label}`}
                            </button>
                          )}
                        </div>
                      ) : undefined
                    }
                  >
                    {group.options.map((option) => {
                      const isSelected = selectedValues.has(option.value)
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => {
                            if (isSelected) {
                              selectedValues.delete(option.value)
                            } else {
                              selectedValues.add(option.value)
                            }
                            const filterValues = Array.from(selectedValues)
                            column?.setFilterValue(filterValues.length ? filterValues : undefined)
                          }}
                        >
                          <div
                            className={cn(
                              'flex size-4 items-center justify-center rounded-sm border border-primary',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'opacity-50 [&_svg]:invisible'
                            )}
                          >
                            <CheckIcon className={cn('h-4 w-4 text-background')} />
                          </div>
                          {option.icon && <option.icon className="size-4 text-muted-foreground" />}
                          <span>{option.label}</span>
                          {facets?.get(option.value) && (
                            <span className="ms-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                              {facets.get(option.value)}
                            </span>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </div>
              )
            })}
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    清除筛选
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
