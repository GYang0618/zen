import { useRoles } from '../roles-provider'
import { RolesActionDialog } from './roles-action-dialog'
import { RolesDeleteDialog } from './roles-delete-dialog'

type RolesDialogsProps = {
  onCreated?: (roleId: string) => void
  onDeleted?: (roleId: string) => void
}

export function RolesDialogs({ onCreated, onDeleted }: RolesDialogsProps) {
  const { open, setOpen, currentRow, setCurrentRow } = useRoles()

  const handleAddOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'add' : null)
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
      <RolesActionDialog
        key="role-add"
        open={open === 'add'}
        onOpenChange={handleAddOpenChange}
        onCreated={onCreated}
      />

      {currentRow ? (
        <RolesDeleteDialog
          key={`role-delete-${currentRow.id}`}
          open={open === 'delete'}
          onOpenChange={handleDeleteOpenChange}
          currentRow={currentRow}
          onDeleted={onDeleted}
        />
      ) : null}
    </>
  )
}
