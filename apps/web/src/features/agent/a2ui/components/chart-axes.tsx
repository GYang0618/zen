import { XAxis, YAxis } from 'recharts'

import { useChartCanvasWidth } from './chart-shared'
import { OverflowText } from './overflow-text'

const VALUE_AXIS_WIDTH = 44
const VALUE_AXIS_WITH_UNIT_WIDTH = 56
const CATEGORY_AXIS_MIN = 96
const CATEGORY_AXIS_MAX = 176
const CATEGORY_AXIS_RATIO = 0.36
const CATEGORY_AXIS_FALLBACK = 128
const TICK_CHAR_WIDTH = 7
const HORIZONTAL_ROW_SINGLE = 36
const HORIZONTAL_ROW_DOUBLE = 44
const HORIZONTAL_CHART_MIN_HEIGHT = 280
const DENSE_TICK_BAND = 40

export interface ChartCategoryTickProps {
  x?: number | string
  y?: number | string
  payload?: { value?: unknown }
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit'
  slotWidth: number
  lines?: 1 | 2
  align?: 'start' | 'middle' | 'end'
}

export function resolveCategoryAxisWidth(containerWidth: number) {
  const basis = containerWidth > 0 ? containerWidth : CATEGORY_AXIS_FALLBACK / CATEGORY_AXIS_RATIO
  return Math.round(
    Math.min(CATEGORY_AXIS_MAX, Math.max(CATEGORY_AXIS_MIN, basis * CATEGORY_AXIS_RATIO))
  )
}

function categoryTickLines(labels: string[], slotWidth: number): 1 | 2 {
  const maxChars = Math.max(4, Math.floor(slotWidth / TICK_CHAR_WIDTH))
  const needsWrap = labels.some((label) => label.includes('\n') || label.length > maxChars)
  return needsWrap ? 2 : 1
}

export function horizontalBarChartHeight(labels: string[], containerWidth: number) {
  const slotWidth = Math.max(72, resolveCategoryAxisWidth(containerWidth) - 8)
  const row =
    categoryTickLines(labels, slotWidth) === 2 ? HORIZONTAL_ROW_DOUBLE : HORIZONTAL_ROW_SINGLE
  return Math.max(HORIZONTAL_CHART_MIN_HEIGHT, Math.max(labels.length, 1) * row)
}

function resolveXTickBand(containerWidth: number, count: number) {
  const basis = containerWidth > 0 ? containerWidth : 320
  return Math.max(28, Math.floor((basis - VALUE_AXIS_WIDTH - 24) / Math.max(count, 1)))
}

function alignFromAnchor(anchor: ChartCategoryTickProps['textAnchor']): 'start' | 'middle' | 'end' {
  if (anchor === 'start' || anchor === 'end') return anchor
  return 'middle'
}

export function ChartCategoryTick({
  x = 0,
  y = 0,
  payload,
  textAnchor,
  slotWidth,
  lines = 1,
  align
}: ChartCategoryTickProps) {
  const xPos = Number(x) || 0
  const yPos = Number(y) || 0
  const full = String(payload?.value ?? '')
  const resolvedAlign = align ?? alignFromAnchor(textAnchor)
  const slotHeight = lines === 2 ? 32 : 16
  const offsetX =
    resolvedAlign === 'end' ? -slotWidth : resolvedAlign === 'start' ? 0 : -slotWidth / 2
  const justify =
    resolvedAlign === 'end' ? 'flex-end' : resolvedAlign === 'start' ? 'flex-start' : 'center'

  return (
    <g transform={`translate(${xPos},${yPos})`}>
      <foreignObject
        x={offsetX}
        y={-slotHeight / 2}
        width={slotWidth}
        height={slotHeight}
        className="overflow-visible"
      >
        <div
          className="flex h-full w-full min-w-0 items-center overflow-hidden font-sans"
          style={{ justifyContent: justify }}
        >
          <OverflowText
            lines={lines}
            side={resolvedAlign === 'end' ? 'left' : 'top'}
            className={
              resolvedAlign === 'end'
                ? 'text-end text-[11px] leading-tight text-muted-foreground'
                : resolvedAlign === 'start'
                  ? 'text-start text-[11px] leading-tight text-muted-foreground'
                  : 'text-center text-[11px] leading-tight text-muted-foreground'
            }
          >
            {full}
          </OverflowText>
        </div>
      </foreignObject>
    </g>
  )
}

export function ChartCategoryXAxis({
  dataKey = 'label',
  count
}: {
  dataKey?: string
  count: number
}) {
  const canvasWidth = useChartCanvasWidth()
  const band = resolveXTickBand(canvasWidth, count)

  return (
    <XAxis
      dataKey={dataKey}
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      interval={band < DENSE_TICK_BAND ? 'equidistantPreserveStart' : 0}
      tick={(props) => (
        <ChartCategoryTick
          x={props.x}
          y={props.y}
          payload={props.payload}
          textAnchor={props.textAnchor}
          slotWidth={Math.max(28, band - 4)}
          lines={1}
          align="middle"
        />
      )}
    />
  )
}

export function ChartCategoryYAxis({
  dataKey = 'label',
  labels
}: {
  dataKey?: string
  labels: string[]
}) {
  const canvasWidth = useChartCanvasWidth()
  const axisWidth = resolveCategoryAxisWidth(canvasWidth)
  const slotWidth = Math.max(72, axisWidth - 8)
  const lines = categoryTickLines(labels, slotWidth)

  return (
    <YAxis
      type="category"
      dataKey={dataKey}
      tickLine={false}
      axisLine={false}
      tickMargin={4}
      width={axisWidth}
      interval={0}
      tick={(props) => (
        <ChartCategoryTick
          x={props.x}
          y={props.y}
          payload={props.payload}
          slotWidth={slotWidth}
          lines={lines}
          align="end"
        />
      )}
    />
  )
}

export function ChartValueXAxis() {
  return (
    <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
  )
}

export function ChartValueYAxis({
  yAxisId,
  orientation,
  unit,
  width
}: {
  yAxisId?: string
  orientation?: 'left' | 'right'
  unit?: string
  width?: number
}) {
  return (
    <YAxis
      yAxisId={yAxisId}
      orientation={orientation}
      unit={unit || undefined}
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      tick={{ fontSize: 11 }}
      width={width ?? (unit ? VALUE_AXIS_WITH_UNIT_WIDTH : VALUE_AXIS_WIDTH)}
    />
  )
}
