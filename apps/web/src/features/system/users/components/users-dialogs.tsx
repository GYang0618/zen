import { useUsers } from '../users-provider'
import { UserActionSheet } from './user-action-sheet'
import { UsersDeleteDialog } from './users-delete-dialog'
import { UsersResetPasswordDialog } from './users-reset-password-dialog'

export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers()

  const handleAddOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'add' : null)
  }

  const clearCurrentRowSoon = () => {
    setTimeout(() => {
      setCurrentRow(null)
    }, 500)
  }

  const handleEditOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'edit' : null)
    if (!nextOpen) clearCurrentRowSoon()
  }

  const handleDeleteOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'delete' : null)
    if (!nextOpen) clearCurrentRowSoon()
  }

  const handleResetPasswordOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'reset-password' : null)
    if (!nextOpen) clearCurrentRowSoon()
  }

  return (
    <>
      <UserActionSheet key="user-add" open={open === 'add'} onOpenChange={handleAddOpenChange} />

      {currentRow ? (
        <>
          <UserActionSheet
            key={`user-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={handleEditOpenChange}
            currentRow={currentRow}
          />

          <UsersDeleteDialog
            key={`user-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={handleDeleteOpenChange}
            currentRow={currentRow}
          />

          <UsersResetPasswordDialog
            key={`user-reset-${currentRow.id}`}
            open={open === 'reset-password'}
            onOpenChange={handleResetPasswordOpenChange}
            currentRow={currentRow}
          />
        </>
      ) : null}
    </>
  )
}
