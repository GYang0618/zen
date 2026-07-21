import { useRoles } from '../roles-provider'
import { RolesActionDialog } from './roles-action-dialog'
import { RolesDeleteDialog } from './roles-delete-dialog'

export function RolesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useRoles()

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
      <RolesActionDialog key="role-add" open={open === 'add'} onOpenChange={handleAddOpenChange} />

      {currentRow && (
        <>
          <RolesActionDialog
            key={`role-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={handleEditOpenChange}
            currentRow={currentRow}
          />

          <RolesDeleteDialog
            key={`role-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={handleDeleteOpenChange}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
