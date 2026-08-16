import { useDialogState } from '@zen/ui'
import { createContext, useContext, useState } from 'react'

import type { Role } from '@zen/shared'

type RolesDialogType = 'add' | 'edit' | 'delete' | 'clone'

type RolesContextType = {
  open: RolesDialogType | null
  setOpen: (str: RolesDialogType | null) => void
  currentRow: Role | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Role | null>>
}

const RolesContext = createContext<RolesContextType | null>(null)

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<RolesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Role | null>(null)

  return (
    <RolesContext
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow
      }}
    >
      {children}
    </RolesContext>
  )
}

export const useRoles = () => {
  const rolesContext = useContext(RolesContext)

  if (!rolesContext) {
    throw new Error('useRoles has to be used within <RolesContext>')
  }

  return rolesContext
}
