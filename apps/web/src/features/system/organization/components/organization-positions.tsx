import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Progress,
  Separator
} from '@zen/ui'
import { BriefcaseBusiness, CalendarDays, PanelsTopLeft, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useOrganizationPositions } from '../queries'
import { formatPositionLevel } from '../utils'
import { OrganizationCreatePositionDialog } from './organization-create-position-dialog'

import type { Position } from '../type'

type OrganizationPositionsProps = {
  organizationId: string
}

function matchesPosition(position: Position, keyword: string): boolean {
  const query = keyword.trim().toLowerCase()
  if (!query) return true

  return [position.name, position.code, position.description, position.level]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query)
}

function formatCreatedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function OrganizationPositions({ organizationId }: OrganizationPositionsProps) {
  const { data: positions = [], isLoading } = useOrganizationPositions(organizationId)
  const [keyword, setKeyword] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const filteredPositions = useMemo(
    () => positions.filter((position) => matchesPosition(position, keyword)),
    [keyword, positions]
  )

  return (
    <div className="@container flex flex-col gap-4">
      <section className="flex flex-wrap items-center gap-3">
        <InputGroup className="max-w-sm min-w-56 flex-1">
          <InputGroupInput
            placeholder="搜索岗位名称、编码或描述"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Button type="button" onClick={() => setCreateDialogOpen(true)}>
          <Plus />
          添加岗位
        </Button>
      </section>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">加载岗位…</p>
      ) : filteredPositions.length ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
          {filteredPositions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      ) : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BriefcaseBusiness />
            </EmptyMedia>
            <EmptyTitle>{positions.length ? '未找到匹配岗位' : '暂无岗位'}</EmptyTitle>
            <EmptyDescription>
              {positions.length
                ? '尝试调整搜索关键词，或添加新的岗位编制'
                : '你可点击下方按钮添加岗位'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Button type="button" onClick={() => setCreateDialogOpen(true)}>
              <Plus />
              添加岗位
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <OrganizationCreatePositionDialog
        open={createDialogOpen}
        organizationId={organizationId}
        positions={positions}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}

function PositionCard({ position }: { position: Position }) {
  const vacancy = Math.max(position.headcount - position.activeCount, 0)
  const fillRate =
    position.headcount > 0 ? Math.round((position.activeCount / position.headcount) * 100) : 0

  return (
    <Card className="gap-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted-foreground/10">
              <PanelsTopLeft className="size-4" />
            </div>
            <span className="text-xs">{position.code}</span>
          </div>
          <Badge variant="outline">{vacancy > 0 ? '招聘中' : '已满编'}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <h2 className="text-base font-semibold">{position.name}</h2>
        <p className="mt-1 text-muted-foreground">{formatPositionLevel(position.level)}</p>
        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {position.description || '暂无描述'}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-4" />
            {formatCreatedAt(position.createdAt)}
          </span>
        </div>
        <Separator className="mt-4 mb-3" />
        <Field>
          <FieldLabel>
            <span className="text-sm">{fillRate}%</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {position.activeCount}/{position.headcount} 在岗 · {vacancy} 空缺
            </span>
          </FieldLabel>
          <Progress value={fillRate} />
        </Field>
      </CardContent>
    </Card>
  )
}
