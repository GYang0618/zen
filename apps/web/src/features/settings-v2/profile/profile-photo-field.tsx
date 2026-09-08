import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle
} from '@zen/ui'
import { useEffect, useId, useRef, useState } from 'react'

import { AvatarCropDialog } from './avatar-crop-dialog'

import type { ChangeEvent } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',')
const MAX_SOURCE_SIZE_BYTES = 20 * 1024 * 1024

type ProfilePhotoFieldProps = {
  initialSrc?: string
  fallbackLabel?: string
  onFileChange?: (file: File | null) => void
}

function getInitials(value: string) {
  const normalized = value.trim()
  if (!normalized) return 'U'
  const parts = normalized.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
  }
  return normalized.slice(0, 2).toUpperCase()
}

export function ProfilePhotoField({
  initialSrc,
  fallbackLabel = '用户',
  onFileChange
}: ProfilePhotoFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialSrc)
  const [error, setError] = useState<string>()
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const objectUrlRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    setPreviewUrl(initialSrc)
  }, [initialSrc])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = undefined
    }
  }

  const handleChangePhoto = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
      setError('仅支持 JPG、PNG、WebP 或 GIF 格式')
      return
    }

    if (file.size > MAX_SOURCE_SIZE_BYTES) {
      setError('原图大小不能超过 20MB')
      return
    }

    setPendingFile(file)
    setCropOpen(true)
    setError(undefined)
  }

  const handleCropComplete = (file: File) => {
    revokeObjectUrl()
    const nextUrl = URL.createObjectURL(file)
    objectUrlRef.current = nextUrl
    setPreviewUrl(nextUrl)
    setError(undefined)
    onFileChange?.(file)
  }

  const handleRemove = () => {
    revokeObjectUrl()
    setPendingFile(null)
    setCropOpen(false)
    setPreviewUrl(undefined)
    setError(undefined)
    onFileChange?.(null)
  }

  return (
    <Field orientation="horizontal" data-invalid={error ? true : undefined}>
      <Avatar className="size-20">
        <AvatarImage src={previewUrl} alt="个人头像" />
        <AvatarFallback className="text-lg font-semibold">
          {getInitials(fallbackLabel)}
        </AvatarFallback>
      </Avatar>

      <FieldContent className="gap-2 ml-4">
        <div className="flex flex-col gap-0.5">
          <FieldTitle>头像</FieldTitle>
          <FieldDescription>
            JPG、PNG、WebP 或 GIF；原图最大 20MB，裁切后自动优化。
          </FieldDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleChangePhoto}>
            更换头像
          </Button>
          <Button type="button" variant="ghost" disabled={!previewUrl} onClick={handleRemove}>
            移除
          </Button>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          aria-label="选择头像图片"
          onChange={handleFileChange}
        />
      </FieldContent>

      <AvatarCropDialog
        file={pendingFile}
        open={cropOpen}
        onOpenChange={(nextOpen) => {
          setCropOpen(nextOpen)
          if (!nextOpen) setPendingFile(null)
        }}
        onComplete={handleCropComplete}
      />
    </Field>
  )
}
