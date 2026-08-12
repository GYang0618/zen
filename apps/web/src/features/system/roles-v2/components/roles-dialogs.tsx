import { useRoles } from '../roles-provider'
import { RoleActionDialog } from './role-action-dialog'
import { RoleCloneDialog } from './role-clone-dialog'
import { RoleDeleteDialog } from './role-delete-dialog'

export function RolesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useRoles()

  const handleAddOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOpen(null)
      return
    }
    setCurrentRow(null)
    setOpen('add')
  }

  const handleEditOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOpen(null)
      setTimeout(() => setCurrentRow(null), 300)
      return
    }
    setOpen('edit')
  }

  const handleDeleteOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOpen(null)
      setTimeout(() => setCurrentRow(null), 300)
      return
    }
    setOpen('delete')
  }

  const handleCloneOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOpen(null)
      setTimeout(() => setCurrentRow(null), 300)
      return
    }
    setOpen('clone')
  }

  return (
    <>
      <RoleActionDialog open={open === 'add'} onOpenChange={handleAddOpenChange} />

      {currentRow ? (
        <>
          <RoleActionDialog
            key={`edit-${currentRow.id}`}
            currentRow={currentRow}
            open={open === 'edit'}
            onOpenChange={handleEditOpenChange}
          />
          <RoleDeleteDialog
            key={`delete-${currentRow.id}`}
            currentRow={currentRow}
            open={open === 'delete'}
            onOpenChange={handleDeleteOpenChange}
          />
          <RoleCloneDialog
            key={`clone-${currentRow.id}`}
            currentRow={currentRow}
            open={open === 'clone'}
            onOpenChange={handleCloneOpenChange}
          />
        </>
      ) : null}
    </>
  )
}
