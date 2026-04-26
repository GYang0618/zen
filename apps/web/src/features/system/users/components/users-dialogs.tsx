import { useUsers } from '../users-provider'
import { UsersActionDialog } from './users-action-dialog'
import { UsersDeleteDialog } from './users-delete-dialog'

export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers()

  const handleAddOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'add' : null)
  }

  const handleEditOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'edit' : null)
    if (!nextOpen) {
      setTimeout(() => {
        setCurrentRow(null)
      }, 500)
    }
  }

  const handleDeleteOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'delete' : null)
    if (!nextOpen) {
      setTimeout(() => {
        setCurrentRow(null)
      }, 500)
    }
  }

  return (
    <>
      <UsersActionDialog key="user-add" open={open === 'add'} onOpenChange={handleAddOpenChange} />

      {currentRow && (
        <>
          <UsersActionDialog
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
        </>
      )}
    </>
  )
}
