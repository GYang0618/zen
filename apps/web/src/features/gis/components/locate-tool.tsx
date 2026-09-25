import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import { LocateFixed } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import { useCesium } from '../cesium-provider'
import { locateCameraTo } from '../lib/locate-camera'
import { useGisStore } from '../stores/gis'

const locateCoordinateSchema = z.object({
  longitude: z.number().min(-180, '经度范围为 -180 到 180').max(180, '经度范围为 -180 到 180'),
  latitude: z.number().min(-90, '纬度范围为 -90 到 90').max(90, '纬度范围为 -90 到 90'),
  height: z.number().optional()
})

type LocateFieldErrors = {
  longitude?: string
  latitude?: string
  height?: string
}

type ParsedCoordinateText = {
  longitude: string
  latitude: string
  height: string
}

function splitCoordinatePaste(longitudeText: string, latitudeText: string, heightText: string) {
  const combined = longitudeText.trim()
  if (!combined.includes(',') || latitudeText.trim()) {
    return { longitude: longitudeText, latitude: latitudeText, height: heightText }
  }

  const [longitude = '', latitude = '', height = ''] = combined
    .split(',')
    .map((part) => part.trim())
  return {
    longitude,
    latitude,
    height: height || heightText
  }
}

function readFiniteNumber(raw: string): number | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : undefined
}

function collectFieldErrors(fields: ParsedCoordinateText): LocateFieldErrors {
  const errors: LocateFieldErrors = {}
  if (readFiniteNumber(fields.longitude) === undefined) {
    errors.longitude = '请输入有效经度'
  }
  if (readFiniteNumber(fields.latitude) === undefined) {
    errors.latitude = '请输入有效纬度'
  }
  if (fields.height.trim() && readFiniteNumber(fields.height) === undefined) {
    errors.height = '请输入有效高程'
  }
  return errors
}

export function LocateTool() {
  const { viewer } = useCesium()
  const setActiveTool = useGisStore((state) => state.setActiveTool)

  const [open, setOpen] = useState(false)
  const [longitude, setLongitude] = useState('')
  const [latitude, setLatitude] = useState('')
  const [height, setHeight] = useState('')
  const [errors, setErrors] = useState<LocateFieldErrors>({})
  const [isLocating, setIsLocating] = useState(false)

  const handleLocate = async () => {
    const fields = splitCoordinatePaste(longitude, latitude, height)
    if (
      fields.longitude !== longitude ||
      fields.latitude !== latitude ||
      fields.height !== height
    ) {
      setLongitude(fields.longitude)
      setLatitude(fields.latitude)
      setHeight(fields.height)
    }

    const fieldErrors = collectFieldErrors(fields)
    const longitudeValue = readFiniteNumber(fields.longitude)
    const latitudeValue = readFiniteNumber(fields.latitude)
    const heightValue = fields.height.trim() ? readFiniteNumber(fields.height) : undefined
    const parsed = locateCoordinateSchema.safeParse({
      longitude: longitudeValue,
      latitude: latitudeValue,
      height: heightValue
    })

    if (!parsed.success || Object.keys(fieldErrors).length > 0) {
      const schemaErrors = parsed.success
        ? {}
        : {
            longitude: parsed.error.issues.find((issue) => issue.path[0] === 'longitude')?.message,
            latitude: parsed.error.issues.find((issue) => issue.path[0] === 'latitude')?.message,
            height: parsed.error.issues.find((issue) => issue.path[0] === 'height')?.message
          }
      setErrors({
        longitude: fieldErrors.longitude ?? schemaErrors.longitude,
        latitude: fieldErrors.latitude ?? schemaErrors.latitude,
        height: fieldErrors.height ?? schemaErrors.height
      })
      return
    }

    setErrors({})
    setIsLocating(true)
    setActiveTool('none')

    const resolved = await locateCameraTo(viewer, {
      longitude: parsed.data.longitude,
      latitude: parsed.data.latitude,
      height: parsed.data.height
    })

    setIsLocating(false)
    if (resolved) {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="relative h-9 shrink-0 rounded-full px-3 text-xs font-medium whitespace-nowrap text-foreground/80 transition-all duration-200 hover:bg-white/25 dark:hover:bg-white/10"
                />
              }
            />
          }
        >
          <LocateFixed className="mr-1.5 size-4 shrink-0" />
          <span className="shrink-0 whitespace-nowrap">坐标定位</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          输入经纬度飞行定位，到达后闪烁标记 3 秒
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        side="top"
        align="center"
        className="w-72 rounded-2xl border-white/25 bg-background/85 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10"
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            void handleLocate()
          }}
        >
          <div className="font-semibold text-xs text-foreground">坐标定位</div>
          <FieldGroup className="gap-2.5">
            <Field data-invalid={errors.longitude ? true : undefined}>
              <FieldLabel htmlFor="gis-locate-longitude">经度</FieldLabel>
              <Input
                id="gis-locate-longitude"
                inputMode="decimal"
                autoComplete="off"
                placeholder="118.796900 或 经度, 纬度, 高程"
                value={longitude}
                aria-invalid={errors.longitude ? true : undefined}
                onChange={(event) => setLongitude(event.target.value)}
              />
              {errors.longitude ? <FieldError>{errors.longitude}</FieldError> : null}
            </Field>
            <Field data-invalid={errors.latitude ? true : undefined}>
              <FieldLabel htmlFor="gis-locate-latitude">纬度</FieldLabel>
              <Input
                id="gis-locate-latitude"
                inputMode="decimal"
                autoComplete="off"
                placeholder="32.060300"
                value={latitude}
                aria-invalid={errors.latitude ? true : undefined}
                onChange={(event) => setLatitude(event.target.value)}
              />
              {errors.latitude ? <FieldError>{errors.latitude}</FieldError> : null}
            </Field>
            <Field data-invalid={errors.height ? true : undefined}>
              <FieldLabel htmlFor="gis-locate-height">高程（米，可选）</FieldLabel>
              <Input
                id="gis-locate-height"
                inputMode="decimal"
                autoComplete="off"
                placeholder="留空则贴地"
                value={height}
                aria-invalid={errors.height ? true : undefined}
                onChange={(event) => setHeight(event.target.value)}
              />
              {errors.height ? <FieldError>{errors.height}</FieldError> : null}
            </Field>
          </FieldGroup>
          <Button type="submit" size="sm" disabled={isLocating} className="w-full">
            {isLocating ? '定位中…' : '定位'}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
