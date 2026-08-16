import { zodResolver } from '@hookform/resolvers/zod'
import { JOB_PROFILE_ICON_COLOR_VALUES, JOB_PROFILE_ICON_VALUES } from '@zen/shared'
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
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { useCreateJobProfileMutation, useUpdateJobProfileMutation } from '../queries'
import { JOB_PROFILE_LEVEL_OPTIONS } from '../utils'
import { JobProfileIconColorPicker } from './job-profile-icon-color-picker'
import { JobProfileIconPicker } from './job-profile-icon-picker'

import type { JobProfile } from '@zen/shared'

const jobProfileFormSchema = z.object({
  name: z.string().trim().min(1, '岗位名称不能为空').max(100),
  code: z
    .string()
    .trim()
    .regex(/^POS-\d{4}$/i, '岗位编码格式为 POS-四位数字，如 POS-1001'),
  level: z.enum(['P5', 'P6', 'P7', 'P8']),
  family: z.string().trim().max(50),
  icon: z.enum(JOB_PROFILE_ICON_VALUES).nullable(),
  iconColor: z.enum(JOB_PROFILE_ICON_COLOR_VALUES).nullable(),
  description: z.string().trim().max(500)
})

type JobProfileFormValues = z.infer<typeof jobProfileFormSchema>

type JobProfileFormDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  currentRow: JobProfile | null
  onOpenChange: (open: boolean) => void
}

function createDefaultValues(row: JobProfile | null): JobProfileFormValues {
  if (row) {
    return {
      name: row.name,
      code: row.code,
      level: (['P5', 'P6', 'P7', 'P8'].includes(row.level)
        ? row.level
        : 'P6') as JobProfileFormValues['level'],
      family: row.family ?? '',
      icon: row.icon,
      iconColor: row.iconColor,
      description: row.description ?? ''
    }
  }

  return {
    name: '',
    code: `POS-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    level: 'P6',
    family: '',
    icon: 'briefcase-business',
    iconColor: 'sky',
    description: ''
  }
}

export function JobProfileFormDialog({
  open,
  mode,
  currentRow,
  onOpenChange
}: JobProfileFormDialogProps) {
  const createMutation = useCreateJobProfileMutation()
  const updateMutation = useUpdateJobProfileMutation()
  const form = useForm<JobProfileFormValues>({
    resolver: zodResolver(jobProfileFormSchema),
    values: createDefaultValues(mode === 'edit' ? currentRow : null)
  })

  const pending = createMutation.isPending || updateMutation.isPending
  const iconColor = useWatch({ control: form.control, name: 'iconColor' })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) form.reset(createDefaultValues(null))
    onOpenChange(nextOpen)
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      level: values.level,
      family: values.family.trim() || undefined,
      icon: values.icon,
      iconColor: values.iconColor,
      description: values.description.trim() || undefined
    }

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          ...payload,
          code: values.code.trim().toUpperCase()
        })
      } else if (currentRow) {
        await updateMutation.mutateAsync({
          id: currentRow.id,
          data: payload
        })
      }
      onOpenChange(false)
    } catch {
      // mutation toast
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '新建岗位' : '编辑岗位'}</DialogTitle>
        </DialogHeader>

        <form id="job-profile-form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="job-profile-name">岗位名称</FieldLabel>
                  <Input
                    {...field}
                    id="job-profile-name"
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
                  <FieldLabel htmlFor="job-profile-code">岗位编码</FieldLabel>
                  <Input
                    {...field}
                    id="job-profile-code"
                    placeholder="例如：POS-1001"
                    disabled={mode === 'edit'}
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                </Field>
              )}
            />

            <Controller
              name="icon"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="job-profile-icon">岗位图标</FieldLabel>
                  <JobProfileIconPicker
                    id="job-profile-icon"
                    value={field.value}
                    color={iconColor}
                    onValueChange={field.onChange}
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                </Field>
              )}
            />

            <Controller
              name="iconColor"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="job-profile-icon-color">图标颜色</FieldLabel>
                  <JobProfileIconColorPicker
                    id="job-profile-icon-color"
                    value={field.value}
                    onValueChange={field.onChange}
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
                    <FieldLabel>标准职级</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid || undefined}>
                        <SelectValue placeholder="选择职级" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_PROFILE_LEVEL_OPTIONS.map((option) => (
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
                name="family"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="job-profile-family">岗位族</FieldLabel>
                    <Input
                      {...field}
                      id="job-profile-family"
                      placeholder="例如：研发"
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
                  <FieldLabel htmlFor="job-profile-description">岗位描述</FieldLabel>
                  <Textarea
                    {...field}
                    id="job-profile-description"
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
          <Button type="submit" form="job-profile-form" disabled={pending}>
            {mode === 'create' ? '确认创建' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
