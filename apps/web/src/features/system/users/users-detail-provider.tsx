import { useDialogState } from '@zen/ui'
import React from 'react'

import type { User } from '@zen/shared'

type UsersDetailDialogType =
  | 'edit'
  | 'reset-password'
  | 'revoke-sessions'
  | 'assign-roles'
  | 'assign-organizations'

type UsersDetailContextType = {
  open: UsersDetailDialogType | null
  setOpen: (str: UsersDetailDialogType | null) => void
  user: User
}

const UsersDetailContext = React.createContext<UsersDetailContextType | null>(null)

export function UsersDetailProvider({ user, children }: { user: User; children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<UsersDetailDialogType>(null)

  return <UsersDetailContext value={{ open, setOpen, user }}>{children}</UsersDetailContext>
}

export const useUsersDetail = () => {
  const usersDetailContext = React.useContext(UsersDetailContext)

  if (!usersDetailContext) {
    throw new Error('useUsersDetail has to be used within <UsersDetailContext>')
  }

  return usersDetailContext
}
