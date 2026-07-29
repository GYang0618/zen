import { useRoles } from '../roles-provider'
import { RoleActionDialog } from './role-action-dialog'

export function RolesDialogs() {
  const { open, setOpen } = useRoles()
  const handleAddOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen ? 'add' : null)
  }

  return <RoleActionDialog open={open === 'add'} onOpenChange={handleAddOpenChange} />
}
