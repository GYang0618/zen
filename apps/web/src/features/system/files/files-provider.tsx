import { createContext, useContext, useState } from 'react'

import type { FileAsset } from '@zen/shared'
import type { ReactNode } from 'react'

type FilesDialogType = 'upload' | 'preview' | 'delete' | 'restore' | 'purge' | null

type FilesContextValue = {
  open: FilesDialogType
  setOpen: (type: FilesDialogType) => void
  currentRow: FileAsset | null
  setCurrentRow: (row: FileAsset | null) => void
}

const FilesContext = createContext<FilesContextValue | null>(null)

export function FilesProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<FilesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<FileAsset | null>(null)

  return (
    <FilesContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </FilesContext.Provider>
  )
}

export function useFiles() {
  const context = useContext(FilesContext)
  if (!context) throw new Error('useFiles 必须在 FilesProvider 内使用')
  return context
}
