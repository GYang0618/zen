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

import type { ChangeEvent } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif'] as const
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',')
const MAX_SIZE_BYTES = 2 * 1024 * 1024

type ProfilePhotoFieldProps = {
  initialSrc?: string
  fallbackLabel?: string
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

export function ProfilePhotoField({ initialSrc, fallbackLabel = '用户' }: ProfilePhotoFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialSrc)
  const [error, setError] = useState<string>()
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
      setError('仅支持 JPG、PNG 或 GIF 格式')
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('图片大小不能超过 2MB')
      return
    }

    revokeObjectUrl()
    const nextUrl = URL.createObjectURL(file)
    objectUrlRef.current = nextUrl
    setPreviewUrl(nextUrl)
    setError(undefined)
  }

  const handleRemove = () => {
    revokeObjectUrl()
    setPreviewUrl(undefined)
    setError(undefined)
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
          <FieldDescription>JPG、PNG 或 GIF。最大 2MB。</FieldDescription>
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
    </Field>
  )
}
