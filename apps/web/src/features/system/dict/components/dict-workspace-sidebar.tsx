import {
  Badge,
  Button,
  cn,
  Input,
  Item,
  ItemContent,
  ItemGroup,
  ItemTitle,
  ScrollArea,
  toast
} from '@zen/ui'
import { Database, Folder, FolderOpen, Plus, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useCreateWorkspaceMutation, useUpdateWorkspaceMutation } from '../mutations'
import { useWorkspacesQuery } from '../queries'

interface DictWorkspaceSidebarProps {
  activeWorkspaceId: string
  onSelectWorkspace: (id: string) => void
}

export function DictWorkspaceSidebar({
  activeWorkspaceId,
  onSelectWorkspace
}: DictWorkspaceSidebarProps) {
  const { data } = useWorkspacesQuery()
  const createMutation = useCreateWorkspaceMutation()
  const updateMutation = useUpdateWorkspaceMutation()

  const [isAdding, setIsAdding] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const addInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding) {
      addInputRef.current?.focus()
      addInputRef.current?.select()
    }
  }, [isAdding])

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingId])

  const stats = data?.stats ?? { allCount: 0, starredCount: 0 }
  const workspaces = data?.workspaces ?? []

  const handleCreateSubmit = async () => {
    const trimmed = newSpaceName.trim()
    if (!trimmed) {
      setIsAdding(false)
      setNewSpaceName('')
      return
    }

    try {
      const created = await createMutation.mutateAsync({ name: trimmed })
      toast.add({ title: '空间创建成功', type: 'success' })
      setIsAdding(false)
      setNewSpaceName('')
      onSelectWorkspace(created.id)
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      toast.add({ title: '创建空间失败', description: message, type: 'error' })
    }
  }

  const handleUpdateSubmit = async (id: string) => {
    const trimmed = editingName.trim()
    if (!trimmed) {
      setEditingId(null)
      setEditingName('')
      return
    }

    try {
      await updateMutation.mutateAsync({ id, data: { name: trimmed } })
      toast.add({ title: '空间重命名成功', type: 'success' })
      setEditingId(null)
      setEditingName('')
    } catch (error) {
      const message = error instanceof Error ? error.message : '重命名失败'
      toast.add({ title: '重命名失败', description: message, type: 'error' })
    }
  }

  const handleStartRename = (workspace: { id: string; name: string }) => {
    setEditingId(workspace.id)
    setEditingName(workspace.name)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between pb-2.5 pr-4 pl-2">
        <h2 className="text-base font-semibold text-foreground tracking-tight">字典空间</h2>
      </div>

      <ScrollArea className="flex-1 overflow-hidden">
        <ItemGroup className="gap-1 pr-4">
          <Item
            className={cn(
              'px-3 py-2 cursor-pointer transition-colors rounded-lg',
              activeWorkspaceId === 'all' && 'bg-muted/80 text-foreground font-medium shadow-2xs'
            )}
            onClick={() => onSelectWorkspace('all')}
          >
            <Database className="size-5 shrink-0 text-muted-foreground" />
            <ItemContent>
              <ItemTitle className="text-sm">全部</ItemTitle>
            </ItemContent>
            <Badge variant="outline" className="rounded-full text-xs tabular-nums">
              {stats.allCount}
            </Badge>
          </Item>

          <Item
            className={cn(
              'px-3 py-2 cursor-pointer transition-colors rounded-lg',
              activeWorkspaceId === 'starred' &&
                'bg-muted/80 text-foreground font-medium shadow-2xs'
            )}
            onClick={() => onSelectWorkspace('starred')}
          >
            <Star
              className={cn(
                'size-5 shrink-0',
                activeWorkspaceId === 'starred'
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-muted-foreground'
              )}
            />
            <ItemContent>
              <ItemTitle className="text-sm">收藏</ItemTitle>
            </ItemContent>
            <Badge variant="outline" className="rounded-full text-xs tabular-nums">
              {stats.starredCount}
            </Badge>
          </Item>

          {workspaces.map((space) => {
            const isSelected = activeWorkspaceId === space.id
            const isEditingThis = editingId === space.id

            return (
              <Item
                key={space.id}
                className={cn(
                  'px-3 py-2 cursor-pointer transition-colors rounded-lg group',
                  isSelected && 'bg-muted/80 text-foreground font-medium shadow-2xs'
                )}
                onClick={() => {
                  if (!isEditingThis) onSelectWorkspace(space.id)
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  handleStartRename(space)
                }}
              >
                {isSelected ? (
                  <FolderOpen className="size-5 shrink-0 text-primary" />
                ) : (
                  <Folder className="size-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                )}

                <ItemContent className="min-w-0">
                  {isEditingThis ? (
                    <Input
                      ref={editInputRef}
                      value={editingName}
                      className="h-7 text-xs px-2 py-0"
                      onChange={(e) => setEditingName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void handleUpdateSubmit(space.id)
                        } else if (e.key === 'Escape') {
                          setEditingId(null)
                          setEditingName('')
                        }
                      }}
                      onBlur={() => void handleUpdateSubmit(space.id)}
                    />
                  ) : (
                    <ItemTitle className="text-sm truncate select-none" title="双击重命名">
                      {space.name}
                    </ItemTitle>
                  )}
                </ItemContent>

                {!isEditingThis && (
                  <Badge variant="outline" className="rounded-full text-xs tabular-nums">
                    {space.dictionaryCount}
                  </Badge>
                )}
              </Item>
            )
          })}

          {isAdding && (
            <Item className="px-3 py-2  rounded-lg">
              <Folder className="size-5 shrink-0 text-muted-foreground" />
              <ItemContent className="min-w-0">
                <Input
                  ref={addInputRef}
                  value={newSpaceName}
                  placeholder="空间名称，回车确认"
                  className="h-7 text-xs px-2 py-0"
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleCreateSubmit()
                    } else if (e.key === 'Escape') {
                      setIsAdding(false)
                      setNewSpaceName('')
                    }
                  }}
                  onBlur={() => void handleCreateSubmit()}
                />
              </ItemContent>
            </Item>
          )}
        </ItemGroup>

        <div className="px-3 pl-2 pr-4 sticky bottom-0 pt-2 pb-1 bg-background/80 backdrop-blur-xs">
          <Button
            variant="outline"
            className="w-full border-dashed h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setIsAdding(true)
              setNewSpaceName('')
            }}
          >
            <Plus className="size-3.5 mr-1" />
            新增空间
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}
