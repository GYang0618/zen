import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Slider,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  SyntheticEvent
} from 'react'

const OUTPUT_SIZE = 1024
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024
const MAX_SOURCE_PIXELS = 40_000_000
const MAX_ZOOM = 3
const DEFAULT_CROP = { x: 0, y: 0, zoom: 1 }

type Crop = typeof DEFAULT_CROP

type ImageSize = {
  width: number
  height: number
}

type CropLayout = {
  width: number
  height: number
  maxPanX: number
  maxPanY: number
}

type DragSession = {
  pointerId: number
  startX: number
  startY: number
  crop: Crop
}

type AvatarCropDialogProps = {
  file: File | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (file: File) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getCropLayout(image: ImageSize, cropSize: number, zoom: number): CropLayout {
  const scale = Math.max(cropSize / image.width, cropSize / image.height) * zoom
  const width = image.width * scale
  const height = image.height * scale
  return {
    width,
    height,
    maxPanX: Math.max(0, (width - cropSize) / 2),
    maxPanY: Math.max(0, (height - cropSize) / 2)
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }
        reject(new Error('无法生成裁切后的头像'))
      },
      type,
      quality
    )
  })
}

function drawCroppedAvatar(source: HTMLImageElement, crop: Crop, outputSize: number) {
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize

  const context = canvas.getContext('2d')
  if (!context) throw new Error('浏览器不支持图片裁切')

  const layout = getCropLayout(
    { width: source.naturalWidth, height: source.naturalHeight },
    outputSize,
    crop.zoom
  )
  const offsetX = crop.x * layout.maxPanX
  const offsetY = crop.y * layout.maxPanY
  const drawX = (outputSize - layout.width) / 2 + offsetX
  const drawY = (outputSize - layout.height) / 2 + offsetY

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, drawX, drawY, layout.width, layout.height)
  return canvas
}

function extensionForMimeType(type: string) {
  if (type === 'image/png') return 'png'
  if (type === 'image/jpeg') return 'jpg'
  return 'webp'
}

async function createCroppedAvatar(source: HTMLImageElement, crop: Crop): Promise<File> {
  for (const outputSize of [OUTPUT_SIZE, 768, 512]) {
    const canvas = drawCroppedAvatar(source, crop, outputSize)
    for (const quality of [0.88, 0.72]) {
      const blob = await canvasToBlob(canvas, 'image/webp', quality)
      if (blob.size <= MAX_OUTPUT_BYTES) {
        return new File([blob], `avatar.${extensionForMimeType(blob.type)}`, {
          type: blob.type || 'image/webp',
          lastModified: Date.now()
        })
      }
    }
  }

  const fallbackCanvas = drawCroppedAvatar(source, crop, 512)
  const fallbackBlob = await canvasToBlob(fallbackCanvas, 'image/jpeg', 0.82)
  if (fallbackBlob.size > MAX_OUTPUT_BYTES) {
    throw new Error('裁切后的头像仍然过大，请缩小图片内容后重试')
  }

  return new File([fallbackBlob], `avatar.${extensionForMimeType(fallbackBlob.type)}`, {
    type: fallbackBlob.type || 'image/jpeg',
    lastModified: Date.now()
  })
}

export function AvatarCropDialog({ file, open, onOpenChange, onComplete }: AvatarCropDialogProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const cropSurfaceRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragSession | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string>()
  const [imageSize, setImageSize] = useState<ImageSize>()
  const [surfaceSize, setSurfaceSize] = useState(0)
  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP)
  const [error, setError] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)

  const setCropSurface = useCallback((surface: HTMLDivElement | null) => {
    cropSurfaceRef.current = surface
    if (surface) setSurfaceSize(surface.getBoundingClientRect().width)
  }, [])

  useEffect(() => {
    setCrop(DEFAULT_CROP)
    setImageSize(undefined)
    setError(undefined)
    setIsSaving(false)

    if (!file || !open) {
      setSourceUrl(undefined)
      return
    }

    const url = URL.createObjectURL(file)
    setSourceUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file, open])

  useEffect(() => {
    if (!open) return
    const surface = cropSurfaceRef.current
    if (!surface) return

    const updateSize = () => setSurfaceSize(surface.getBoundingClientRect().width)
    updateSize()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateSize)
    observer.observe(surface)
    return () => observer.disconnect()
  }, [open])

  const layout = useMemo(() => {
    if (!imageSize || surfaceSize <= 0) return null
    return getCropLayout(imageSize, surfaceSize, crop.zoom)
  }, [crop.zoom, imageSize, surfaceSize])

  const updateCropPosition = useCallback((next: Partial<Pick<Crop, 'x' | 'y'>>) => {
    setCrop((current) => ({
      ...current,
      x: next.x === undefined ? current.x : clamp(next.x, -1, 1),
      y: next.y === undefined ? current.y : clamp(next.y, -1, 1)
    }))
  }, [])

  const updateZoom = useCallback((nextZoom: number) => {
    setCrop((current) => ({ ...current, zoom: clamp(nextZoom, 1, MAX_ZOOM) }))
  }, [])

  const changeZoom = useCallback((amount: number) => {
    setCrop((current) => ({ ...current, zoom: clamp(current.zoom + amount, 1, MAX_ZOOM) }))
  }, [])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!layout || isSaving || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      crop
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || !layout) return

    updateCropPosition({
      x: layout.maxPanX > 0 ? drag.crop.x + (event.clientX - drag.startX) / layout.maxPanX : 0,
      y: layout.maxPanY > 0 ? drag.crop.y + (event.clientY - drag.startY) / layout.maxPanY : 0
    })
  }

  const endPointerDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleCropWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!layout || isSaving) return
    event.preventDefault()
    changeZoom(event.deltaY < 0 ? 0.1 : -0.1)
  }

  const handleCropKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!layout || isSaving) return
    const step = 0.08
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        updateCropPosition({ x: crop.x - step })
        break
      case 'ArrowRight':
        event.preventDefault()
        updateCropPosition({ x: crop.x + step })
        break
      case 'ArrowUp':
        event.preventDefault()
        updateCropPosition({ y: crop.y - step })
        break
      case 'ArrowDown':
        event.preventDefault()
        updateCropPosition({ y: crop.y + step })
        break
      case '+':
      case '=':
        event.preventDefault()
        changeZoom(0.1)
        break
      case '-':
        event.preventDefault()
        changeZoom(-0.1)
        break
    }
  }

  const handleSave = async () => {
    const image = imageRef.current
    if (!image || !imageSize) return

    setIsSaving(true)
    setError(undefined)
    try {
      const croppedFile = await createCroppedAvatar(image, crop)
      onComplete(croppedFile)
      onOpenChange(false)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '裁切头像失败')
    } finally {
      setIsSaving(false)
    }
  }

  const offsetX = layout ? crop.x * layout.maxPanX : 0
  const offsetY = layout ? crop.y * layout.maxPanY : 0

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalHeight, naturalWidth } = event.currentTarget
    if (!naturalWidth || !naturalHeight) {
      setError('无法读取图片尺寸')
      return
    }
    if (naturalWidth * naturalHeight > MAX_SOURCE_PIXELS) {
      setError('图片分辨率过高，请选择 4000 万像素以内的图片')
      return
    }
    setImageSize({ width: naturalWidth, height: naturalHeight })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isSaving) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton={!isSaving}>
        <DialogHeader className="px-4 pt-4 pr-12">
          <DialogTitle>裁切头像</DialogTitle>
          <DialogDescription>
            {file?.type === 'image/gif' ? 'GIF 会以首帧作为头像。' : '调整头像取景。'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 py-4">
          <div
            ref={setCropSurface}
            className="relative mx-auto aspect-square w-full max-w-96 cursor-grab overflow-hidden rounded-lg bg-black outline-none ring-1 ring-foreground/15 touch-none select-none active:cursor-grabbing"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: 头像裁切画布支持键盘按键操作取景
            tabIndex={0}
            role="region"
            aria-label="头像裁切区域"
            onKeyDown={handleCropKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointerDrag}
            onPointerCancel={endPointerDrag}
            onWheel={handleCropWheel}
          >
            {!sourceUrl || (!imageSize && !error) ? (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" aria-label="正在读取图片" />
              </div>
            ) : null}
            {sourceUrl ? (
              <img
                ref={imageRef}
                src={sourceUrl}
                alt="待裁切的头像"
                draggable={false}
                className={
                  layout
                    ? 'pointer-events-none absolute max-w-none select-none'
                    : 'pointer-events-none absolute size-px opacity-0'
                }
                style={
                  layout
                    ? {
                        width: layout.width,
                        height: layout.height,
                        left: `calc(50% + ${offsetX}px)`,
                        top: `calc(50% + ${offsetY}px)`,
                        transform: 'translate(-50%, -50%)'
                      }
                    : undefined
                }
                onLoad={handleImageLoad}
                onError={() => setError('无法读取该图片，请选择其他文件')}
              />
            ) : null}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="缩小头像"
                    disabled={!imageSize || isSaving || crop.zoom <= 1}
                    onClick={() => changeZoom(-0.1)}
                  />
                }
              >
                <ZoomOut />
              </TooltipTrigger>
              <TooltipContent>缩小</TooltipContent>
            </Tooltip>
            <Slider
              value={[crop.zoom]}
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              disabled={!imageSize || isSaving}
              aria-label="缩放头像"
              onValueChange={(value) => {
                const zoom = typeof value === 'number' ? value : value[0]
                if (zoom === undefined) return
                updateZoom(zoom)
              }}
            />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="放大头像"
                    disabled={!imageSize || isSaving || crop.zoom >= MAX_ZOOM}
                    onClick={() => changeZoom(0.1)}
                  />
                }
              >
                <ZoomIn />
              </TooltipTrigger>
              <TooltipContent>放大</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="重置裁切"
                    disabled={!imageSize || isSaving}
                    onClick={() => setCrop(DEFAULT_CROP)}
                  />
                }
              >
                <RotateCcw />
              </TooltipTrigger>
              <TooltipContent>重置裁切</TooltipContent>
            </Tooltip>
          </div>

          {error ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="button" disabled={!imageSize || isSaving} onClick={() => void handleSave()}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            使用此头像
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
