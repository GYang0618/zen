import { createContext, useContext, useState } from 'react'

import type { FileAsset } from '@zen/shared'
import type { ReactNode } from 'react'

type FilesDialogType = 'upload' | 'delete' | 'restore' | 'purge' | null

type FilesContextValue = {
  open: FilesDialogType
  setOpen: (type: FilesDialogType) => void
  currentRow: FileAsset | null
  setCurrentRow: (row: FileAsset | null) => void
  previewFile: FileAsset | null
  hasPreviousPreview: boolean
  hasNextPreview: boolean
  openPreview: (file: FileAsset, candidates?: FileAsset[]) => void
  previousPreview: () => void
  nextPreview: () => void
  closePreview: () => void
}

const FilesContext = createContext<FilesContextValue | null>(null)

export function FilesProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<FilesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<FileAsset | null>(null)
  const [previewFile, setPreviewFile] = useState<FileAsset | null>(null)
  const [previewImages, setPreviewImages] = useState<FileAsset[]>([])

  const previewIndex = previewFile
    ? previewImages.findIndex((candidate) => candidate.id === previewFile.id)
    : -1
  const hasPreviousPreview = previewIndex > 0
  const hasNextPreview = previewIndex >= 0 && previewIndex < previewImages.length - 1

  const openPreview = (file: FileAsset, candidates: FileAsset[] = []) => {
    if (file.status !== 'ready') return
    const images = candidates.filter(
      (candidate) => candidate.status === 'ready' && candidate.category === 'image'
    )
    const containsFile = images.some((candidate) => candidate.id === file.id)

    setPreviewFile(file)
    setPreviewImages(file.category === 'image' ? (containsFile ? images : [file]) : [])
  }

  const previousPreview = () => {
    if (!hasPreviousPreview) return
    setPreviewFile(previewImages[previewIndex - 1] ?? null)
  }

  const nextPreview = () => {
    if (!hasNextPreview) return
    setPreviewFile(previewImages[previewIndex + 1] ?? null)
  }

  const closePreview = () => {
    setPreviewFile(null)
    setPreviewImages([])
  }

  return (
    <FilesContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        previewFile,
        openPreview,
        hasPreviousPreview,
        hasNextPreview,
        previousPreview,
        nextPreview,
        closePreview
      }}
    >
      {children}
    </FilesContext.Provider>
  )
}

export function useFiles() {
  const context = useContext(FilesContext)
  if (!context) throw new Error('useFiles 必须在 FilesProvider 内使用')
  return context
}
