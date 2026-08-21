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
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { useJobProfilesQuery } from '@/features/system/posts/queries'
import { formatJobProfileLevel } from '@/features/system/posts/utils'

import { useCreateOrganizationPosition } from '../queries'
import { POSITION_LEVEL_OPTIONS } from '../utils'

import type { Position } from '../type'

const linkPositionFormSchema = z.object({
  jobProfileId: z.string().min(1, '请选择岗位'),
  headcount: z.coerce.number().int().min(1, '编制人数至少为 1').max(999),
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

  const form = useForm<LinkPositionFormValues>({
    resolver: zodResolver(linkPositionFormSchema),
    defaultValues: createDefaultValues()
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) form.reset(createDefaultValues())
    onOpenChange(nextOpen)
  }

  const handleSubmit = form.handleSubmit(async (values) => {
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
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>关联岗位</DialogTitle>
        </DialogHeader>

        <form id="link-position-form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <FieldGroup>
            <Controller
              name="jobProfileId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>岗位目录</FieldLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={fieldState.invalid || undefined}>
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
                  {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="headcount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="link-position-headcount">编制人数</FieldLabel>
                    <Input
                      id="link-position-headcount"
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

              <Controller
                name="level"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>职级覆盖（可选）</FieldLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) =>
                        field.onChange(value === '__default__' ? '' : value)
                      }
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid || undefined}>
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
                  <FieldLabel htmlFor="link-position-description">编制说明</FieldLabel>
                  <Textarea
                    {...field}
                    id="link-position-description"
                    placeholder="可选，补充本组织对该岗位的说明"
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
