import { useForm } from '@tanstack/react-form'
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
import { useMemo } from 'react'
import { z } from 'zod'

import { useJobProfilesQuery } from '@/features/system/posts/queries'
import { formatJobProfileLevel } from '@/features/system/posts/utils'

import { useCreateOrganizationPosition } from '../queries'
import { POSITION_LEVEL_OPTIONS } from '../utils'

import type { Position } from '../type'

const linkPositionFormSchema = z.object({
  jobProfileId: z.string().min(1, '请选择岗位'),
  headcount: z.number().int().min(1, '编制人数至少为 1').max(999),
  level: z.enum(['P5', 'P6', 'P7', 'P8']).or(z.literal('')),
  description: z.string().trim().max(500)
})

type LinkPositionFormValues = z.infer<typeof linkPositionFormSchema>

type OrganizationCreatePositionDialogProps = {
  open: boolean
  organizationId: string
  positions: readonly Position[]
  onOpenChange: (open: boolean) => void
}

function createDefaultValues(): LinkPositionFormValues {
  return {
    jobProfileId: '',
    headcount: 1,
    level: '',
    description: ''
  }
}

export function OrganizationCreatePositionDialog({
  open,
  organizationId,
  positions,
  onOpenChange
}: OrganizationCreatePositionDialogProps) {
  const linkPosition = useCreateOrganizationPosition(organizationId)
  const { data: profilesData } = useJobProfilesQuery({
    page: 1,
    pageSize: 100,
    status: 'active'
  })

  const linkedProfileIds = useMemo(
    () => new Set(positions.map((item) => item.jobProfileId)),
    [positions]
  )

  const availableProfiles = useMemo(
    () => (profilesData?.items ?? []).filter((item) => !linkedProfileIds.has(item.id)),
    [linkedProfileIds, profilesData?.items]
  )

  const form = useForm({
    defaultValues: createDefaultValues() as LinkPositionFormValues,
    validators: { onChange: linkPositionFormSchema },
    onSubmit: async ({ value }) => {
      await handleSubmit(linkPositionFormSchema.parse(value))
    }
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) form.reset(createDefaultValues())
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (values: LinkPositionFormValues) => {
    try {
      await linkPosition.mutateAsync({
        jobProfileId: values.jobProfileId,
        headcount: values.headcount,
        level: values.level || undefined,
        description: values.description.trim() || undefined
      })
      onOpenChange(false)
    } catch {
      // mutation toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>关联岗位</DialogTitle>
        </DialogHeader>

        <form
          id="link-position-form"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="jobProfileId">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid || undefined}>
                  <FieldLabel>岗位目录</FieldLabel>
                  <Select value={field.state.value || undefined} onValueChange={field.handleChange}>
                    <SelectTrigger aria-invalid={!field.state.meta.isValid || undefined}>
                      <SelectValue
                        placeholder={
                          availableProfiles.length === 0
                            ? '暂无可关联岗位，请先在岗位管理中创建'
                            : '选择岗位'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name} · {formatJobProfileLevel(profile.level)}
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

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="headcount">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid || undefined}>
                    <FieldLabel htmlFor="link-position-headcount">编制人数</FieldLabel>
                    <Input
                      id="link-position-headcount"
                      type="number"
                      min={1}
                      max={999}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.valueAsNumber)}
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

              <form.Field name="level">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid || undefined}>
                    <FieldLabel>职级覆盖（可选）</FieldLabel>
                    <Select
                      value={field.state.value || undefined}
                      onValueChange={(value) =>
                        field.handleChange(
                          linkPositionFormSchema.shape.level.parse(
                            value === '__default__' ? '' : value
                          )
                        )
                      }
                    >
                      <SelectTrigger aria-invalid={!field.state.meta.isValid || undefined}>
                        <SelectValue placeholder="使用岗位标准职级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__default__">使用岗位标准职级</SelectItem>
                        {POSITION_LEVEL_OPTIONS.map((option) => (
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
            </div>

            <form.Field name="description">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid || undefined}>
                  <FieldLabel htmlFor="link-position-description">编制说明</FieldLabel>
                  <Textarea
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    id="link-position-description"
                    placeholder="可选，补充本组织对该岗位的说明"
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
          <Button
            type="submit"
            form="link-position-form"
            disabled={linkPosition.isPending || availableProfiles.length === 0}
          >
            确认关联
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
