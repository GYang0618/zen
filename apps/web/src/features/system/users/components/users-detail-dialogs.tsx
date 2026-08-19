import { useUsersDetail } from '../users-detail-provider'
import { AssignUserOrganizationsDialog } from './assign-user-organizations-dialog'
import { AssignUserRolesDialog } from './assign-user-roles-dialog'
import { UserActionSheet } from './user-action-sheet'
import { UsersResetPasswordDialog } from './users-reset-password-dialog'
import { UsersRevokeSessionsDialog } from './users-revoke-sessions-dialog'

export function UsersDetailDialogs() {
  const { open, setOpen, user } = useUsersDetail()

  const handleOpenChange = (nextOpen: boolean) => {
    // useDialogState 对相同值会 toggle。弹层受控期间可能回传 true，不能再 setOpen(当前类型)。
    if (!nextOpen) setOpen(null)
  }

  return (
    <>
      <UserActionSheet
        key={`user-edit-${user.id}`}
        open={open === 'edit'}
        onOpenChange={handleOpenChange}
        currentRow={user}
      />

      <UsersResetPasswordDialog
        key={`user-reset-${user.id}`}
        open={open === 'reset-password'}
        onOpenChange={handleOpenChange}
        currentRow={user}
      />

      <UsersRevokeSessionsDialog
        key={`user-revoke-${user.id}`}
        open={open === 'revoke-sessions'}
        onOpenChange={handleOpenChange}
        currentRow={user}
      />

      <AssignUserRolesDialog
        key={`user-roles-${user.id}`}
        open={open === 'assign-roles'}
        onOpenChange={handleOpenChange}
        user={user}
      />

      <AssignUserOrganizationsDialog
        key={`user-orgs-${user.id}`}
        open={open === 'assign-organizations'}
        onOpenChange={handleOpenChange}
        user={user}
      />
    </>
  )
}
