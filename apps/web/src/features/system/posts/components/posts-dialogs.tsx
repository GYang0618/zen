import { ConfirmDialog } from '@/components/confirm-dialog'

import { usePosts } from '../posts-provider'
import { useDisableJobProfileMutation } from '../queries'
import { JobProfileDeleteDialog } from './job-profile-delete-dialog'
import { JobProfileFormDialog } from './job-profile-form-dialog'

export function PostsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = usePosts()
  const disableMutation = useDisableJobProfileMutation()
  const formMode = open === 'edit' ? 'edit' : 'create'
  const formOpen = open === 'create' || open === 'edit'

  const handleDeleteOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOpen(null)
      setCurrentRow(null)
      return
    }
    setOpen('delete')
  }

  return (
    <>
      <JobProfileFormDialog
        open={formOpen}
        mode={formMode}
        currentRow={currentRow}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
      />

      <ConfirmDialog
        open={open === 'disable'}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
        title="停用岗位？"
        desc={
          currentRow
            ? `确认停用「${currentRow.name}」？已关联组织的编制仍会保留，但不可再新关联到组织。`
            : '确认停用该岗位？'
        }
        cancelBtnText="取消"
        confirmText="确认停用"
        destructive
        isLoading={disableMutation.isPending}
        handleConfirm={() => {
          if (!currentRow) return
          disableMutation.mutate(currentRow.id, {
            onSuccess: () => {
              setOpen(null)
              setCurrentRow(null)
            }
          })
        }}
      />

      {currentRow ? (
        <JobProfileDeleteDialog
          key={`delete-${currentRow.id}`}
          open={open === 'delete'}
          currentRow={currentRow}
          onOpenChange={handleDeleteOpenChange}
        />
      ) : null}
    </>
  )
}
