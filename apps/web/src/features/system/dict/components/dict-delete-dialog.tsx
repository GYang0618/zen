import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  toast
} from '@zen/ui'

import { useDeleteDictionaryMutation } from '../mutations'

import type { DictionaryListItem } from '@zen/shared'

interface DictDeleteDialogProps {
  dictionary: DictionaryListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DictDeleteDialog({
  dictionary,
  open,
  onOpenChange,
  onSuccess
}: DictDeleteDialogProps) {
  const deleteMutation = useDeleteDictionaryMutation()

  if (!dictionary) return null

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(dictionary.id)
      toast.add({ title: '字典已删除', type: 'success' })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      toast.add({ title: '删除失败', description: message, type: 'error' })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除该字典？</AlertDialogTitle>
          <AlertDialogDescription>
            此操作将彻底删除字典{' '}
            <span className="font-semibold text-foreground">
              {dictionary.name} ({dictionary.code})
            </span>{' '}
            及其所有字典项配置，操作后无法恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault()
              void handleDelete()
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? '正在删除...' : '确认删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
