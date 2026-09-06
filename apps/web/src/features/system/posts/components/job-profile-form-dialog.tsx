import { useForm, useStore } from '@tanstack/react-form'
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
import { useEffect, useState } from 'react'
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
  const [initialValues] = useState(() => createDefaultValues(mode === 'edit' ? currentRow : null))
  const form = useForm({
    defaultValues: initialValues,
    validators: { onChange: jobProfileFormSchema },
    onSubmit: async ({ value }) => {
      await handleSubmit(jobProfileFormSchema.parse(value))
    }
  })

  const pending = createMutation.isPending || updateMutation.isPending
  const iconColor = useStore(form.store, (state) => state.values.iconColor)

  useEffect(() => {
    if (open) form.reset(createDefaultValues(mode === 'edit' ? currentRow : null))
  }, [open, mode, currentRow, form])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) form.reset(createDefaultValues(null))
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (values: JobProfileFormValues) => {
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
          code: values.code.trim().toUpperCase(),
          status: 'active'
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
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '新建岗位' : '编辑岗位'}</DialogTitle>
        </DialogHeader>

        <form
          id="job-profile-form"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="name">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid || undefined}>
                  <FieldLabel htmlFor="job-profile-name">岗位名称</FieldLabel>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    id="job-profile-name"
                    placeholder="例如：高级前端工程师"
                    aria-invalid={!field.state.meta.isValid || undefined}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <FieldError>
                      {field.state.meta.errors.map((error) => error?.message).join(', ')}
                    </FieldError>
                  ) : null}
                </Field>
              )}
            </form.Field>

            <form.Field name="code">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid || undefined}>
                  <FieldLabel htmlFor="job-profile-code">岗位编码</FieldLabel>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    id="job-profile-code"
                    placeholder="例如：POS-1001"
                    disabled={mode === 'edit'}
                    aria-invalid={!field.state.meta.isValid || undefined}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <FieldError>
                      {field.state.meta.errors.map((error) => error?.message).join(', ')}
                    </FieldError>
                  ) : null}
                </Field>
              )}
            </form.Field>

            <form.Field name="icon">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid || undefined}>
                  <FieldLabel htmlFor="job-profile-icon">岗位图标</FieldLabel>
                  <JobProfileIconPicker
                    id="job-profile-icon"
                    value={field.state.value}
                    color={iconColor}
                    onValueChange={field.handleChange}
                    aria-invalid={!field.state.meta.isValid || undefined}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <FieldError>
                      {field.state.meta.errors.map((error) => error?.message).join(', ')}
                    </FieldError>
                  ) : null}
                </Field>
              )}
            </form.Field>

            <form.Field name="iconColor">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid || undefined}>
                  <FieldLabel htmlFor="job-profile-icon-color">图标颜色</FieldLabel>
                  <JobProfileIconColorPicker
                    id="job-profile-icon-color"
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    aria-invalid={!field.state.meta.isValid || undefined}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <FieldError>
                      {field.state.meta.errors.map((error) => error?.message).join(', ')}
                    </FieldError>
                  ) : null}
                </Field>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="level">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid || undefined}>
                    <FieldLabel>标准职级</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(jobProfileFormSchema.shape.level.parse(value))
                      }
                    >
                      <SelectTrigger aria-invalid={!field.state.meta.isValid || undefined}>
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
                    {field.state.meta.errors.length > 0 ? (
                      <FieldError>
                        {field.state.meta.errors.map((error) => error?.message).join(', ')}
                      </FieldError>
                    ) : null}
                  </Field>
                )}
              </form.Field>

              <form.Field name="family">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid || undefined}>
                    <FieldLabel htmlFor="job-profile-family">岗位族</FieldLabel>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      id="job-profile-family"
                      placeholder="例如：研发"
                      aria-invalid={!field.state.meta.isValid || undefined}
                    />
                    {field.state.meta.errors.length > 0 ? (
                      <FieldError>
                        {field.state.meta.errors.map((error) => error?.message).join(', ')}
                      </FieldError>
                    ) : null}
                  </Field>
                )}
              </form.Field>
            </div>

            <form.Field name="description">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid || undefined}>
                  <FieldLabel htmlFor="job-profile-description">岗位描述</FieldLabel>
                  <Textarea
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    id="job-profile-description"
                    placeholder="简要说明岗位职责"
                    rows={3}
                    aria-invalid={!field.state.meta.isValid || undefined}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <FieldError>
                      {field.state.meta.errors.map((error) => error?.message).join(', ')}
                    </FieldError>
                  ) : null}
                </Field>
              )}
            </form.Field>
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
