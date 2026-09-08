import { PermissionCode } from '@zen/shared'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Separator,
  Skeleton
} from '@zen/ui'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Trash2,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { Can } from '@/components/auth/can'

import { downloadFile } from '../download-file'
import { useFileUrlQuery } from '../queries'

import type { FileAsset } from '@zen/shared'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  SyntheticEvent
} from 'react'

const MIN_IMAGE_ZOOM = 1
const MAX_IMAGE_ZOOM = 4
const IMAGE_ZOOM_STEP = 0.25
const DEFAULT_IMAGE_VIEW = { x: 0, y: 0, zoom: MIN_IMAGE_ZOOM }

type FilePreviewDialogProps = {
  file: FileAsset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (file: FileAsset) => void
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

export function FilePreviewDialog({
  file,
  open,
  onOpenChange,
  onDelete,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext
}: FilePreviewDialogProps) {
  const isImage = file?.category === 'image'
  const imageViewer = useImageViewer(isImage ? file?.id : undefined)
  const { changeZoom, reset } = imageViewer
  const { data, isLoading, isError } = useFileUrlQuery(
    file?.id,
    'inline',
    open && file?.status === 'ready'
  )

  const handlePreviewKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!open || !isImage || event.defaultPrevented || isEditableEventTarget(event.target)) return
      if (event.altKey || event.ctrlKey || event.metaKey) return

      switch (event.key) {
        case 'ArrowLeft':
          if (!hasPrevious) return
          event.preventDefault()
          onPrevious()
          break
        case 'ArrowRight':
          if (!hasNext) return
          event.preventDefault()
          onNext()
          break
        case '+':
        case '=':
          event.preventDefault()
          changeZoom(IMAGE_ZOOM_STEP)
          break
        case '-':
          event.preventDefault()
          changeZoom(-IMAGE_ZOOM_STEP)
          break
        case '0':
          event.preventDefault()
          reset()
          break
      }
    },
    [changeZoom, hasNext, hasPrevious, isImage, onNext, onPrevious, open, reset]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!fixed !inset-0 !z-[1201] !flex !h-dvh !max-w-none !flex-col !gap-0 !translate-x-0 !translate-y-0 !rounded-none !border-0 !p-0 !ring-0 sm:!max-w-none"
        onKeyDownCapture={handlePreviewKeyDown}
      >
        <DialogTitle className="sr-only">{file?.originalName ?? '文件预览'}</DialogTitle>
        <DialogDescription className="sr-only">文件预览</DialogDescription>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/20">
          {!file || isLoading ? (
            <div className="flex size-full items-center justify-center px-4 py-6 pb-24 sm:pb-28">
              <Skeleton className="h-[min(60vh,40rem)] w-full max-w-5xl" />
            </div>
          ) : null}
          {isError ? (
            <div className="flex size-full items-center justify-center px-4 py-6 pb-24 text-center text-sm text-muted-foreground sm:pb-28">
              无法加载预览，请尝试下载。
            </div>
          ) : null}
          {file && data && isImage ? (
            <div className="absolute inset-0 pb-24 sm:pb-28">
              <ZoomableImagePreview
                file={file}
                url={data.url}
                viewer={imageViewer}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                onPrevious={onPrevious}
                onNext={onNext}
              />
            </div>
          ) : null}
          {file && data && !isImage ? (
            <div className="flex size-full items-center justify-center overflow-auto px-4 py-6 pb-24 sm:px-6 sm:pb-28">
              <PreviewBody file={file} url={data.url} />
            </div>
          ) : null}
        </div>

        {file ? (
          <PreviewActions
            file={file}
            imageViewer={isImage ? imageViewer : undefined}
            onClose={() => onOpenChange(false)}
            onDelete={() => onDelete(file)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

type PreviewActionsProps = {
  file: FileAsset
  imageViewer?: ImageViewer
  onClose: () => void
  onDelete: () => void
}

function PreviewActions({ file, imageViewer, onClose, onDelete }: PreviewActionsProps) {
  return (
    <div
      role="toolbar"
      aria-label={`${file.originalName} 的预览操作`}
      className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-xl border bg-background/95 p-2 shadow-xl backdrop-blur-lg supports-backdrop-filter:bg-background/60"
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 rounded-full"
          aria-label="退出预览"
          title="退出预览"
          onClick={onClose}
        >
          <X />
          <span className="sr-only">退出预览</span>
        </Button>

        {imageViewer ? (
          <>
            <Separator className="h-5" orientation="vertical" aria-hidden="true" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="缩小图片"
              title="缩小图片"
              disabled={!imageViewer.canZoomOut}
              onClick={() => imageViewer.changeZoom(-IMAGE_ZOOM_STEP)}
            >
              <ZoomOut />
              <span className="sr-only">缩小图片</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="放大图片"
              title="放大图片"
              disabled={!imageViewer.canZoomIn}
              onClick={() => imageViewer.changeZoom(IMAGE_ZOOM_STEP)}
            >
              <ZoomIn />
              <span className="sr-only">放大图片</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="重置图片缩放"
              title="重置图片缩放"
              disabled={!imageViewer.canReset}
              onClick={imageViewer.reset}
            >
              <RotateCcw />
              <span className="sr-only">重置图片缩放</span>
            </Button>
          </>
        ) : null}

        <Separator className="h-5" orientation="vertical" aria-hidden="true" />

        <Can permission={PermissionCode.FILE_READ}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label={`下载 ${file.originalName}`}
            title="下载"
            onClick={() => void downloadFile(file)}
          >
            <Download />
            <span className="sr-only">下载</span>
          </Button>
        </Can>

        <Can permission={PermissionCode.FILE_DELETE}>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="size-8"
            aria-label={`将 ${file.originalName} 移入回收站`}
            title="移入回收站"
            onClick={onDelete}
          >
            <Trash2 />
            <span className="sr-only">移入回收站</span>
          </Button>
        </Can>
      </div>
    </div>
  )
}

function PreviewBody({ file, url }: { file: FileAsset; url: string }) {
  if (file.category === 'video') {
    return <AutoPlayMutedVideo key={url} url={url} label={file.originalName} />
  }
  if (file.mimeType === 'application/pdf') {
    return (
      <iframe
        title={file.originalName}
        src={url}
        className="h-[calc(100dvh-11rem)] w-full max-w-6xl bg-background"
      />
    )
  }
  return (
    <p className="text-sm text-muted-foreground">该类型暂不支持站内预览，请使用下载查看原文。</p>
  )
}

type ImageSize = {
  width: number
  height: number
}

type ViewportSize = ImageSize

type ImageView = {
  x: number
  y: number
  zoom: number
}

type ImageLayout = {
  width: number
  height: number
  maxPanX: number
  maxPanY: number
}

type ImageDragSession = {
  pointerId: number
  startX: number
  startY: number
  view: ImageView
}

type ImageLoadState = 'idle' | 'loading' | 'loaded' | 'error'

type ImageViewer = {
  view: ImageView
  layout: ImageLayout | null
  setSurface: (surface: HTMLDivElement | null) => void
  isImageLoading: boolean
  hasImageError: boolean
  canZoomIn: boolean
  canZoomOut: boolean
  canReset: boolean
  changeZoom: (amount: number) => void
  reset: () => void
  handlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  handlePointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  endPointerDrag: (event: ReactPointerEvent<HTMLDivElement>) => void
  handleWheel: (event: ReactWheelEvent<HTMLDivElement>) => void
  handleImageLoad: (event: SyntheticEvent<HTMLImageElement>) => void
  handleImageError: () => void
}

type ZoomableImagePreviewProps = {
  file: FileAsset
  url: string
  viewer: ImageViewer
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

function ZoomableImagePreview({
  file,
  url,
  viewer,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext
}: ZoomableImagePreviewProps) {
  const { hasImageError, isImageLoading, layout, view } = viewer

  return (
    <div
      ref={viewer.setSurface}
      className={cn(
        'relative size-full overflow-hidden touch-none select-none outline-none',
        view.zoom > MIN_IMAGE_ZOOM ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      )}
      role="region"
      aria-label={`${file.originalName} 图片预览区域`}
      aria-busy={isImageLoading}
      onPointerDown={viewer.handlePointerDown}
      onPointerMove={viewer.handlePointerMove}
      onPointerUp={viewer.endPointerDrag}
      onPointerCancel={viewer.endPointerDrag}
      onLostPointerCapture={viewer.endPointerDrag}
      onWheel={viewer.handleWheel}
    >
      <img
        key={file.id}
        src={url}
        alt={file.originalName}
        draggable={false}
        className={cn(
          'pointer-events-none absolute max-w-none select-none will-change-transform',
          layout ? 'opacity-100' : 'size-px opacity-0'
        )}
        style={
          layout
            ? {
                width: layout.width,
                height: layout.height,
                left: `calc(50% + ${view.x}px)`,
                top: `calc(50% + ${view.y}px)`,
                transform: `translate3d(-50%, -50%, 0) scale(${view.zoom})`
              }
            : undefined
        }
        onLoad={viewer.handleImageLoad}
        onError={viewer.handleImageError}
      />
      {isImageLoading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 py-6">
          <Skeleton className="h-[min(60vh,40rem)] w-full max-w-5xl" />
        </div>
      ) : null}
      {hasImageError ? (
        <div
          role="alert"
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 py-6 text-center text-sm text-muted-foreground"
        >
          无法加载图片预览，请尝试下载。
        </div>
      ) : null}
      {hasPrevious || hasNext ? (
        <ImageNavigation
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      ) : null}
    </div>
  )
}

type ImageNavigationProps = {
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

function ImageNavigation({ hasPrevious, hasNext, onPrevious, onNext }: ImageNavigationProps) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute top-1/2 left-3 z-10 size-9 -translate-y-1/2 bg-background/95 shadow-sm backdrop-blur-sm sm:left-6"
        aria-label="上一张图片"
        title="上一张图片"
        disabled={!hasPrevious}
        onClick={onPrevious}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <ChevronLeft />
        <span className="sr-only">上一张图片</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute top-1/2 right-3 z-10 size-9 -translate-y-1/2 bg-background/95 shadow-sm backdrop-blur-sm sm:right-6"
        aria-label="下一张图片"
        title="下一张图片"
        disabled={!hasNext}
        onClick={onNext}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <ChevronRight />
        <span className="sr-only">下一张图片</span>
      </Button>
    </>
  )
}

function useImageViewer(fileId: string | undefined): ImageViewer {
  const dragRef = useRef<ImageDragSession | null>(null)
  const [surface, setSurface] = useState<HTMLDivElement | null>(null)
  const [imageSize, setImageSize] = useState<ImageSize>()
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 })
  const [view, setView] = useState<ImageView>(DEFAULT_IMAGE_VIEW)
  const [imageLoadState, setImageLoadState] = useState<ImageLoadState>(fileId ? 'loading' : 'idle')

  useLayoutEffect(() => {
    if (!fileId) {
      setImageLoadState('idle')
      return
    }
    dragRef.current = null
    setImageSize(undefined)
    setView(DEFAULT_IMAGE_VIEW)
    setImageLoadState('loading')
  }, [fileId])

  useEffect(() => {
    if (!surface || !fileId) return

    const updateViewport = () => {
      setViewport({ width: surface.clientWidth, height: surface.clientHeight })
    }

    updateViewport()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateViewport)
    observer.observe(surface)
    return () => observer.disconnect()
  }, [fileId, surface])

  useEffect(() => {
    setView((current) => clampImageView(current, imageSize, viewport))
  }, [imageSize, viewport])

  const layout = useMemo(
    () => getImageLayout(imageSize, viewport, view.zoom),
    [imageSize, view.zoom, viewport]
  )

  const changeZoom = useCallback(
    (amount: number) => {
      setView((current) =>
        clampImageView(
          { ...current, zoom: clamp(current.zoom + amount, MIN_IMAGE_ZOOM, MAX_IMAGE_ZOOM) },
          imageSize,
          viewport
        )
      )
    },
    [imageSize, viewport]
  )

  const reset = useCallback(() => {
    setView(DEFAULT_IMAGE_VIEW)
  }, [])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (view.zoom <= MIN_IMAGE_ZOOM || event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        view
      }
    },
    [view]
  )

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return

      setView(
        clampImageView(
          {
            ...drag.view,
            x: drag.view.x + event.clientX - drag.startX,
            y: drag.view.y + event.clientY - drag.startY
          },
          imageSize,
          viewport
        )
      )
    },
    [imageSize, viewport]
  )

  const endPointerDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault()
      changeZoom(event.deltaY < 0 ? IMAGE_ZOOM_STEP : -IMAGE_ZOOM_STEP)
    },
    [changeZoom]
  )

  const handleImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalHeight, naturalWidth } = event.currentTarget
    if (!naturalWidth || !naturalHeight) {
      setImageLoadState('error')
      return
    }
    setImageSize({ width: naturalWidth, height: naturalHeight })
    setImageLoadState('loaded')
  }, [])

  const handleImageError = useCallback(() => {
    dragRef.current = null
    setImageSize(undefined)
    setImageLoadState('error')
  }, [])

  return {
    view,
    layout,
    setSurface,
    isImageLoading: imageLoadState === 'loading',
    hasImageError: imageLoadState === 'error',
    canZoomIn: view.zoom < MAX_IMAGE_ZOOM,
    canZoomOut: view.zoom > MIN_IMAGE_ZOOM,
    canReset: view.zoom !== MIN_IMAGE_ZOOM || view.x !== 0 || view.y !== 0,
    changeZoom,
    reset,
    handlePointerDown,
    handlePointerMove,
    endPointerDrag,
    handleWheel,
    handleImageLoad,
    handleImageError
  }
}

function getImageLayout(
  image: ImageSize | undefined,
  viewport: ViewportSize,
  zoom: number
): ImageLayout | null {
  if (!image || viewport.width <= 0 || viewport.height <= 0) return null

  const baseScale = Math.min(viewport.width / image.width, viewport.height / image.height)
  const width = image.width * baseScale
  const height = image.height * baseScale

  return {
    width,
    height,
    maxPanX: Math.max(0, (width * zoom - viewport.width) / 2),
    maxPanY: Math.max(0, (height * zoom - viewport.height) / 2)
  }
}

function clampImageView(view: ImageView, image: ImageSize | undefined, viewport: ViewportSize) {
  const zoom = clamp(view.zoom, MIN_IMAGE_ZOOM, MAX_IMAGE_ZOOM)
  const layout = getImageLayout(image, viewport, zoom)
  if (!layout) return { ...view, zoom }

  return {
    x: clamp(view.x, -layout.maxPanX, layout.maxPanX),
    y: clamp(view.y, -layout.maxPanY, layout.maxPanY),
    zoom
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isEditableEventTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
  )
}

function AutoPlayMutedVideo({ url, label }: { url: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.defaultMuted = true
    const play = () => {
      video.muted = true
      void video.play().catch(() => undefined)
    }
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      play()
    } else {
      video.addEventListener('canplay', play, { once: true })
    }
    return () => {
      video.removeEventListener('canplay', play)
      video.pause()
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src={url}
      controls
      autoPlay
      muted
      playsInline
      className="max-h-[calc(100dvh-11rem)] max-w-full bg-black"
      aria-label={label}
    >
      <track kind="captions" label="未提供字幕" />
      浏览器不支持视频预览
    </video>
  )
}
