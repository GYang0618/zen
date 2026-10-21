import { arrayMove } from '@dnd-kit/helpers'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Separator,
  Switch
} from '@zen/ui'
import { CirclePlus, GripVertical, Layers, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { getDictionaryItemFieldValidationError } from '../validation'

import type { DragEndEvent } from '@dnd-kit/react'
import type { DictionaryItem, DictStatus } from '@zen/shared'
import type { ReactNode } from 'react'
import type { DictionaryItemField } from '../validation'

interface DictItemsCardProps {
  items: DictionaryItem[]
  onChange: (items: DictionaryItem[]) => void
  isEditing: boolean
}

export function DictItemsCard({ items, onChange, isEditing }: DictItemsCardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [clientIds, setClientIds] = useState(() => items.map(() => crypto.randomUUID()))
  const [itemErrors, setItemErrors] = useState<
    Record<string, Partial<Record<DictionaryItemField, string>>>
  >({})

  useEffect(() => {
    setClientIds((current) => {
      if (current.length === items.length) return current
      return Array.from(
        { length: items.length },
        (_, index) => current[index] ?? crypto.randomUUID()
      )
    })
  }, [items.length])

  const filteredItemsWithIndex = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return items
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        if (!q) return true
        const label = item.label.toLowerCase()
        const value = item.value.toLowerCase()
        const description = (item.description ?? '').toLowerCase()
        return label.includes(q) || value.includes(q) || description.includes(q)
      })
  }, [items, searchQuery])

  const itemIds = items.map((item, index) => item.id ?? clientIds[index] ?? `item-${index}`)

  const handleAddItem = () => {
    const nextSort = items.length > 0 ? Math.max(...items.map((i) => i.sort)) + 1 : 1
    onChange([
      ...items,
      {
        label: '',
        value: '',
        description: '',
        sort: nextSort,
        status: 'ACTIVE'
      }
    ])
    setClientIds((current) => [...current, crypto.randomUUID()])
  }

  const handleUpdateItem = (originalIndex: number, patch: Partial<DictionaryItem>) => {
    const next = [...items]
    next[originalIndex] = { ...next[originalIndex], ...patch }
    onChange(next)

    const itemId = itemIds[originalIndex]
    setItemErrors((current) => {
      const currentErrors = current[itemId]
      if (!currentErrors) return current

      const nextErrors = { ...currentErrors }
      for (const field of Object.keys(patch) as DictionaryItemField[]) {
        if (!Object.hasOwn(currentErrors, field)) continue
        const error = getDictionaryItemFieldValidationError(next[originalIndex], field)
        if (error) nextErrors[field] = error
        else delete nextErrors[field]
      }

      return { ...current, [itemId]: nextErrors }
    })
  }

  const handleFieldBlur = (originalIndex: number, field: DictionaryItemField) => {
    const itemId = itemIds[originalIndex]
    const error = getDictionaryItemFieldValidationError(items[originalIndex], field)
    setItemErrors((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        [field]: error
      }
    }))
  }

  const handleRemoveItem = (originalIndex: number) => {
    const itemId = itemIds[originalIndex]
    onChange(items.filter((_, i) => i !== originalIndex))
    setClientIds((current) => current.filter((_, index) => index !== originalIndex))
    setItemErrors((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled || searchQuery.trim()) return
    const { source, target } = event.operation
    if (!source || !target) return
    const fromIndex = itemIds.indexOf(String(source.id))
    const toIndex = itemIds.indexOf(String(target.id))
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return
    const nextItems = arrayMove(items, fromIndex, toIndex).map((item, index) => ({
      ...item,
      sort: index + 1
    }))
    setClientIds((current) => arrayMove(current, fromIndex, toIndex))
    onChange(nextItems)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold">字典项</CardTitle>
        <CardDescription>添加、编辑和维护当前字典下的枚举项配置。</CardDescription>
        <CardAction>
          <InputGroup className="max-w-xs">
            <InputGroupInput
              placeholder="搜索字典项..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            {searchQuery.trim() && (
              <InputGroupAddon align="inline-end" className="text-xs tabular-nums">
                {filteredItemsWithIndex.length} 项
              </InputGroupAddon>
            )}
          </InputGroup>
        </CardAction>
      </CardHeader>

      <CardContent>
        <FieldGroup className="gap-4">
          {filteredItemsWithIndex.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
              {items.length === 0 ? '暂无字典项配置' : '没有找到匹配的字典项'}
              {isEditing && items.length === 0 && (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="rounded-xl"
                  >
                    <CirclePlus className="size-4 mr-1.5" />
                    添加首个字典项
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <DragDropProvider onDragEnd={handleDragEnd}>
              {filteredItemsWithIndex.map(({ item, originalIndex }) => {
                const isActive = item.status === 'ACTIVE'
                const displayTitle =
                  item.label || item.value
                    ? `${item.label || '未命名'} · ${item.value || '-'}`
                    : `字典项 ${originalIndex + 1}`
                const displayDesc = item.description?.trim() || (isActive ? '已启用' : '已停用')
                const errors = itemErrors[itemIds[originalIndex]]

                return (
                  <SortableDictionaryItem
                    key={itemIds[originalIndex]}
                    id={itemIds[originalIndex]}
                    index={originalIndex}
                    disabled={!isEditing || Boolean(searchQuery.trim())}
                  >
                    {({ itemRef, handleRef, isDragging }) => (
                      <FieldSet
                        ref={itemRef}
                        className={`bg-muted/20 space-y-3 rounded-2xl border p-4 ${isDragging ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          {isEditing && (
                            <button
                              type="button"
                              ref={handleRef}
                              aria-label={`拖动排序：${displayTitle}`}
                              className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                              data-drag-handle
                            >
                              <GripVertical className="size-4" />
                            </button>
                          )}
                          <div className="size-10 border-border/60 bg-muted/20 flex items-center justify-center rounded-2xl border text-muted-foreground shrink-0">
                            <Layers className="size-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <FieldLegend className="truncate font-medium text-sm">
                              {displayTitle}
                            </FieldLegend>
                            <FieldDescription className="truncate text-xs text-muted-foreground">
                              {displayDesc}
                            </FieldDescription>
                          </div>

                          <div className="flex items-center gap-2.5 ml-auto shrink-0">
                            <Switch
                              id={`status-${originalIndex}`}
                              checked={isActive}
                              disabled={!isEditing}
                              onCheckedChange={(checked) =>
                                handleUpdateItem(originalIndex, {
                                  status: (checked ? 'ACTIVE' : 'DISABLED') as DictStatus
                                })
                              }
                            />
                            {isEditing && (
                              <>
                                <Separator orientation="vertical" className="h-4" />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => handleRemoveItem(originalIndex)}
                                  title="删除该项"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditing && (
                          <FieldGroup>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Field>
                                <Input
                                  placeholder="标签（label）"
                                  value={item.label}
                                  maxLength={20}
                                  aria-invalid={Boolean(errors?.label)}
                                  onBlur={() => handleFieldBlur(originalIndex, 'label')}
                                  onChange={(e) =>
                                    handleUpdateItem(originalIndex, { label: e.target.value })
                                  }
                                />
                                {errors?.label && (
                                  <p className="text-xs text-destructive">{errors.label}</p>
                                )}
                              </Field>
                              <Field>
                                <Input
                                  placeholder="值（value）"
                                  value={item.value}
                                  pattern="[A-Za-z0-9_]+"
                                  aria-invalid={Boolean(errors?.value)}
                                  onBlur={() => handleFieldBlur(originalIndex, 'value')}
                                  onChange={(e) =>
                                    handleUpdateItem(originalIndex, { value: e.target.value })
                                  }
                                  className="font-mono"
                                />
                                {errors?.value && (
                                  <p className="text-xs text-destructive">{errors.value}</p>
                                )}
                              </Field>
                              <Field>
                                <Input
                                  placeholder="描述说明"
                                  value={item.description ?? ''}
                                  maxLength={50}
                                  aria-invalid={Boolean(errors?.description)}
                                  onBlur={() => handleFieldBlur(originalIndex, 'description')}
                                  onChange={(e) =>
                                    handleUpdateItem(originalIndex, { description: e.target.value })
                                  }
                                />
                                {errors?.description && (
                                  <p className="text-xs text-destructive">{errors.description}</p>
                                )}
                              </Field>
                            </div>
                          </FieldGroup>
                        )}
                      </FieldSet>
                    )}
                  </SortableDictionaryItem>
                )
              })}
            </DragDropProvider>
          )}

          {isEditing && (
            <div>
              <Button type="button" variant="outline" onClick={handleAddItem}>
                <CirclePlus className="size-4 mr-1.5" /> 添加字典项
              </Button>
            </div>
          )}
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

function SortableDictionaryItem({
  id,
  index,
  disabled,
  children
}: {
  id: string
  index: number
  disabled: boolean
  children: (refs: {
    itemRef: (element: Element | null) => void
    handleRef: (element: Element | null) => void
    isDragging: boolean
  }) => ReactNode
}) {
  const { ref, handleRef, isDragging } = useSortable({ id, index, disabled })

  return children({ itemRef: ref, handleRef, isDragging })
}
