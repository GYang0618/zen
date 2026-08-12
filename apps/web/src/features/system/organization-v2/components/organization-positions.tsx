import { zodResolver } from '@hookform/resolvers/zod'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea
} from '@zen/ui'
import { BriefcaseBusiness, CalendarDays, PanelsTopLeft, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { Position } from '../type'
import { formatPositionLevel, POSITION_LEVEL_OPTIONS } from '../utils'

const positionFormSchema = z.object({
  name: z.string().trim().min(1, '岗位名称不能为空').max(50, '岗位名称不能超过50个字符'),
  code: z
    .string()
    .trim()
    .min(2, '岗位编码至少需要2个字符')
    .max(30, '岗位编码不能超过30个字符')
    .regex(/^POS-\d{4}$/i, '岗位编码格式为 POS-四位数字，如 POS-1001'),
  level: z.string().trim().min(1, '请选择岗位职级'),
  headcount: z.coerce.number().int().min(1, '岗位人数至少为 1').max(999, '岗位人数不能超过 999'),
  description: z.string().trim().min(1, '岗位描述不能为空').max(200, '岗位描述不能超过200个字符')
})

type PositionFormValues = z.infer<typeof positionFormSchema>

function matchesPosition(position: Position, keyword: string): boolean {
  const q = keyword.trim().toLowerCase()
  if (!q) return true
  return [position.name, position.code, position.description, position.level].join(' ').toLowerCase().includes(q)
}

export function OrganizationPositions({ data }: { data: Position[] }) {
  const [positions, setPositions] = useState<Position[]>(data)
  const [keyword, setKeyword] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      name: '',
      code: '',
      level: 'P6',
      headcount: 1,
      description: ''
    }
  })

  const filteredPositions = useMemo(
    () => positions.filter((item) => matchesPosition(item, keyword)),
    [keyword, positions]
  )

  const handleOpenAdd = () => {
    form.reset({
      name: '',
      code: `POS-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      level: 'P6',
      headcount: 1,
      description: ''
    })
    setAddOpen(true)
  }

  const handleSubmit = form.handleSubmit((values) => {
    const code = values.code.trim().toUpperCase()
    if (positions.some((item) => item.code.toLowerCase() === code.toLowerCase())) {
      form.setError('code', { message: '岗位编码已存在' })
      return
    }

    const next: Position = {
      id: Date.now(),
      code,
      name: values.name.trim(),
      description: values.description.trim(),
      level: values.level,
      headcount: values.headcount,
      activeCount: 0
    }
    setPositions((prev) => [next, ...prev])
    setAddOpen(false)
    toast.success(`已添加岗位「${next.name}」`)
  })

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
        <Button type="button" onClick={handleOpenAdd}>
          <Plus />
          添加岗位
        </Button>
      </section>

      {filteredPositions.length ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
          {filteredPositions.map((item) => {
            const vacancy = Math.max(item.headcount - item.activeCount, 0)
            const fillRate =
              item.headcount > 0 ? Math.round((item.activeCount / item.headcount) * 100) : 0

            return (
            <Card key={item.id} className="gap-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted-foreground/10">
                      <PanelsTopLeft className="size-4" />
                    </div>
                    <span className="text-xs">{item.code}</span>
                  </div>
                  <Badge variant="outline">招聘中</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h2 className="text-base font-semibold">{item.name}</h2>
                <p className="mt-1 text-muted-foreground">{formatPositionLevel(item.level)}</p>
                <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                  {item.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="size-4" /> 2026-08-0{' '}
                  </span>
                  <AvatarGroup className="grayscale">
                    <Avatar size="sm">
                      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar size="sm">
                      <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
                      <AvatarFallback>LR</AvatarFallback>
                    </Avatar>
                    <Avatar size="sm">
                      <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
                      <AvatarFallback>ER</AvatarFallback>
                    </Avatar>
                    <AvatarGroupCount>+3</AvatarGroupCount>
                  </AvatarGroup>
                </div>
                <Separator className="mt-4 mb-3" />
                <Field>
                  <FieldLabel>
                    <span className="text-sm">{fillRate}%</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.activeCount}/{item.headcount} 在岗 · {vacancy} 空缺
                    </span>
                  </FieldLabel>
                  <Progress value={fillRate} />
                </Field>
              </CardContent>
            </Card>
            )
          })}
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
            <Button type="button" onClick={handleOpenAdd}>
              <Plus />
              添加岗位
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加岗位</DialogTitle>
          </DialogHeader>

          <form id="add-position-form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="position-name">岗位名称</FieldLabel>
                    <Input
                      {...field}
                      id="position-name"
                      placeholder="例如：高级前端工程师"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                    {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                  </Field>
                )}
              />

              <Controller
                name="code"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="position-code">岗位编码</FieldLabel>
                    <Input
                      {...field}
                      id="position-code"
                      placeholder="例如：POS-1001"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                    {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                  </Field>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="level"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel>岗位职级</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger aria-invalid={fieldState.invalid || undefined}>
                          <SelectValue placeholder="选择职级" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITION_LEVEL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                    </Field>
                  )}
                />

                <Controller
                  name="headcount"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="position-headcount">岗位人数</FieldLabel>
                      <Input
                        id="position-headcount"
                        type="number"
                        min={1}
                        max={999}
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                        aria-invalid={fieldState.invalid || undefined}
                      />
                      {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="position-description">岗位描述</FieldLabel>
                    <Textarea
                      {...field}
                      id="position-description"
                      placeholder="简要说明岗位职责"
                      rows={3}
                      aria-invalid={fieldState.invalid || undefined}
                    />
                    {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              取消
            </Button>
            <Button type="submit" form="add-position-form">
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
