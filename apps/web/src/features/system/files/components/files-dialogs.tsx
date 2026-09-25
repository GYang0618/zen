import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, toast } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { FileUploader } from '@/components/file-uploader'

import { useFiles } from '../files-provider'
import { useDeleteFileMutation, usePurgeFileMutation, useRestoreFileMutation } from '../mutations'
import { filesQueryKeys } from '../queries'
import { FilePreviewDialog } from './file-preview-dialog'

export function FilesDialogs({ accept }: { accept?: string }) {
  const queryClient = useQueryClient()
  const {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
    previewFile,
    hasPreviousPreview,
    hasNextPreview,
    previousPreview,
    nextPreview,
    closePreview
  } = useFiles()
  const deleteFile = useDeleteFileMutation()
  const restoreFile = useRestoreFileMutation()
  const purgeFile = usePurgeFileMutation()

  const close = () => {
    setOpen(null)
    setCurrentRow(null)
  }

  return (
    <>
      <Dialog open={open === 'upload'} onOpenChange={(next) => !next && close()}>
        <DialogContent className="min-w-0 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>上传文件</DialogTitle>
            <DialogDescription>预签名直传到对象存储，完成后写入文件元数据。</DialogDescription>
          </DialogHeader>
          <FileUploader
            purpose="attachment"
            accept={accept}
            multiple
            onSuccess={() => {
              toast.add({ title: '上传成功', type: 'success' })
              void queryClient.invalidateQueries({ queryKey: filesQueryKeys.all })
            }}
            onError={(error) => toast.add({ title: error.message, type: 'error' })}
          />
        </DialogContent>
      </Dialog>

      <FilePreviewDialog
        file={previewFile}
        open={Boolean(previewFile)}
        onOpenChange={(next) => {
          if (!next) closePreview()
        }}
        onDelete={(file) => {
          setCurrentRow(file)
          setOpen('delete')
        }}
        hasPrevious={hasPreviousPreview}
        hasNext={hasNextPreview}
        onPrevious={previousPreview}
        onNext={nextPreview}
      />

      {currentRow && open === 'delete' ? (
        <ConfirmDialog
          open
          className="!z-[1203]"
          overlayClassName="!z-[1202]"
          onOpenChange={(next) => !next && close()}
          title="移入回收站"
          desc={`确定将「${currentRow.originalName}」移入回收站吗？可稍后恢复。`}
          confirmText="删除"
          cancelBtnText="取消"
          destructive
          isLoading={deleteFile.isPending}
          handleConfirm={() => {
            deleteFile.mutate(currentRow.id, {
              onSuccess: () => {
                toast.add({ title: '已移入回收站', type: 'success' })
                close()
                closePreview()
              },
              onError: (error) => toast.add({ title: error.message, type: 'error' })
            })
          }}
        />
      ) : null}

      {currentRow && open === 'restore' ? (
        <ConfirmDialog
          open
          onOpenChange={(next) => !next && close()}
          title="恢复文件"
          desc={`确定恢复「${currentRow.originalName}」吗？`}
          confirmText="恢复"
          cancelBtnText="取消"
          isLoading={restoreFile.isPending}
          handleConfirm={() => {
            restoreFile.mutate(currentRow.id, {
              onSuccess: () => {
                toast.add({ title: '已恢复', type: 'success' })
                close()
              },
              onError: (error) => toast.add({ title: error.message, type: 'error' })
            })
          }}
        />
      ) : null}

      {currentRow && open === 'purge' ? (
        <ConfirmDialog
          open
          onOpenChange={(next) => !next && close()}
          title={
            <span className="text-destructive">
              <AlertTriangle className="me-1 inline-block" size={18} />
              彻底删除
            </span>
          }
          desc={`确定彻底删除「${currentRow.originalName}」？此操作不可恢复。`}
          confirmText="彻底删除"
          cancelBtnText="取消"
          destructive
          isLoading={purgeFile.isPending}
          handleConfirm={() => {
            purgeFile.mutate(currentRow.id, {
              onSuccess: () => {
                toast.add({ title: '已彻底删除', type: 'success' })
                close()
                closePreview()
              },
              onError: (error) => toast.add({ title: error.message, type: 'error' })
            })
          }}
        />
      ) : null}
    </>
  )
}
