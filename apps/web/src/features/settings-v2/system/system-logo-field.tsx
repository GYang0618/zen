import { Button, Field, FieldContent, FieldDescription, FieldTitle } from '@zen/ui'
import { ImageIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import type { ChangeEvent } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'] as const
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',')
const MAX_SIZE_BYTES = 2 * 1024 * 1024

type SystemLogoFieldProps = {
  title?: string
  description?: string
  alt?: string
}

export function SystemLogoField({
  title = '系统 Logo',
  description = '支持 JPG、PNG、SVG 或 WebP，最大 2MB。建议使用透明背景的方形图标。',
  alt = '系统 Logo'
}: SystemLogoFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [error, setError] = useState<string>()
  const objectUrlRef = useRef<string | undefined>(undefined)

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
      setError('仅支持 JPG、PNG、SVG 或 WebP 格式')
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
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
        {previewUrl ? (
          <img src={previewUrl} alt={alt} className="size-full object-contain p-2" />
        ) : (
          <ImageIcon className="size-8 text-muted-foreground" aria-hidden />
        )}
      </div>

      <FieldContent className="ml-4 gap-2">
        <div className="flex flex-col gap-0.5">
          <FieldTitle>{title}</FieldTitle>
          <FieldDescription>{description}</FieldDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleChangePhoto}>
            上传图片
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
          aria-label={`选择${title}图片`}
          onChange={handleFileChange}
        />
      </FieldContent>
    </Field>
  )
}
