import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Label } from '@zen/ui'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PasswordInput } from '@/components'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { FileUploader } from '@/components/file-uploader'
import { authApi } from '@/features/auth/api'

import { useFiles } from '../files-provider'
import { useDeleteFileMutation, usePurgeFileMutation, useRestoreFileMutation } from '../mutations'
import { filesQueryKeys } from '../queries'
import { FilePreviewDialog } from './file-preview-dialog'

export function FilesDialogs({ accept }: { accept?: string }) {
  const queryClient = useQueryClient()
  const { open, setOpen, currentRow, setCurrentRow } = useFiles()
  const deleteFile = useDeleteFileMutation()
  const restoreFile = useRestoreFileMutation()
  const purgeFile = usePurgeFileMutation()
  const [password, setPassword] = useState('')

  const close = () => {
    setOpen(null)
    setCurrentRow(null)
    setPassword('')
  }

  return (
    <>
      <Dialog open={open === 'upload'} onOpenChange={(next) => !next && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传文件</DialogTitle>
            <DialogDescription>预签名直传到对象存储，完成后写入文件元数据。</DialogDescription>
          </DialogHeader>
          <FileUploader
            purpose="attachment"
            accept={accept}
            multiple
            onSuccess={() => {
              toast.success('上传成功')
              void queryClient.invalidateQueries({ queryKey: filesQueryKeys.all })
            }}
            onError={(error) => toast.error(error.message)}
          />
        </DialogContent>
      </Dialog>

      {currentRow && open === 'delete' ? (
        <ConfirmDialog
          open
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
                toast.success('已移入回收站')
                close()
              },
              onError: (error) => toast.error(error.message)
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
                toast.success('已恢复')
                close()
              },
              onError: (error) => toast.error(error.message)
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
          desc={
            <div className="space-y-3">
              <p>确定彻底删除「{currentRow.originalName}」？不可恢复，需输入登录密码。</p>
              <Label>
                登录密码
                <PasswordInput
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="输入当前登录密码"
                />
              </Label>
            </div>
          }
          confirmText="彻底删除"
          cancelBtnText="取消"
          destructive
          disabled={!password}
          isLoading={purgeFile.isPending}
          handleConfirm={() => {
            void (async () => {
              try {
                const { stepUpToken } = await authApi.stepUp({ password })
                purgeFile.mutate(
                  { id: currentRow.id, stepUpToken },
                  {
                    onSuccess: () => {
                      toast.success('已彻底删除')
                      close()
                    },
                    onError: (error) => toast.error(error.message)
                  }
                )
              } catch (error) {
                toast.error(error instanceof Error ? error.message : '二次确认失败')
              }
            })()
          }}
        />
      ) : null}

      <FilePreviewDialog
        file={currentRow}
        open={open === 'preview'}
        onOpenChange={(next) => {
          if (!next) close()
        }}
      />
    </>
  )
}
