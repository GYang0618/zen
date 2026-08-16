import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '@zen/ui'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { useCreateOrganizationPosition } from '../queries'
import { POSITION_LEVEL_OPTIONS } from '../utils'

import type { CreatePosition } from '@zen/shared'
import type { Position } from '../type'

const positionFormSchema = z.object({
  name: z.string().trim().min(1, '岗位名称不能为空').max(100, '岗位名称不能超过100个字符'),
  code: z
    .string()
    .trim()
    .regex(/^POS-\d{4}$/i, '岗位编码格式为 POS-四位数字，如 POS-1001'),
  level: z.enum(['P5', 'P6', 'P7', 'P8']),
  headcount: z.coerce.number().int().min(1, '岗位人数至少为 1').max(999, '岗位人数不能超过 999'),
  description: z.string().trim().max(500, '岗位描述不能超过500个字符')
})

type PositionFormValues = z.infer<typeof positionFormSchema>

type OrganizationCreatePositionDialogProps = {
  open: boolean
  organizationId: string
  positions: readonly Position[]
  onOpenChange: (open: boolean) => void
}

function createDefaultValues(): PositionFormValues {
  return {
    name: '',
    code: `POS-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    level: 'P6',
    headcount: 1,
    description: ''
  }
}

export function OrganizationCreatePositionDialog({
  open,
  organizationId,
  positions,
  onOpenChange
}: OrganizationCreatePositionDialogProps) {
  const createPosition = useCreateOrganizationPosition(organizationId)
  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: createDefaultValues()
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) form.reset(createDefaultValues())
    onOpenChange(nextOpen)
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    const code = values.code.trim().toUpperCase()
    if (positions.some((position) => position.code.toLowerCase() === code.toLowerCase())) {
      form.setError('code', { message: '岗位编码已存在' })
      return
    }

    const payload: CreatePosition = {
      code,
      name: values.name.trim(),
      level: values.level,
      headcount: values.headcount,
      description: values.description.trim() || undefined
    }

    try {
      await createPosition.mutateAsync(payload)
      onOpenChange(false)
    } catch {
      // mutation toast
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="submit" form="add-position-form" disabled={createPosition.isPending}>
            确认添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
