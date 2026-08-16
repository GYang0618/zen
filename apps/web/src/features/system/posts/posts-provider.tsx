import { createContext, useContext, useState } from 'react'

import type { JobProfile } from '@zen/shared'
import type { ReactNode } from 'react'

type PostsDialogType = 'create' | 'edit' | 'disable' | 'delete' | null

type PostsContextValue = {
  open: PostsDialogType
  setOpen: (type: PostsDialogType) => void
  currentRow: JobProfile | null
  setCurrentRow: (row: JobProfile | null) => void
}

const PostsContext = createContext<PostsContextValue | null>(null)

export function PostsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<PostsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<JobProfile | null>(null)

  return (
    <PostsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </PostsContext.Provider>
  )
}

export function usePosts() {
  const context = useContext(PostsContext)
  if (!context) throw new Error('usePosts must be used within PostsProvider')
  return context
}
