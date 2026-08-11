import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Calendar,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea
} from '@zen/ui'
import { Building2, CalendarIcon, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { allowedChildTypes, getOrganizationTypeLabel, ORG_TYPES } from '../data/data'
import { organizationUsers } from '../data/mock'
import { useOrganizations } from '../organizations-provider'
import { OrganizationLeaderSelect } from './organization-leader-select'

import type { Organization, OrganizationLeader } from '../type'

interface OrganizationActionSheetProps {
  currentRow?: Organization
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const TODAY = (() => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
})()

const organizationFormSchema = z.object({
  name: z.string().trim().min(1, '组织名称不能为空').max(100, '组织名称不能超过100个字符'),
  code: z
    .string()
    .trim()
    .min(2, '组织编码至少需要2个字符')
    .max(50, '组织编码不能超过50个字符')
    .regex(/^[a-z][a-z0-9_]*$/, '组织编码仅支持小写字母、数字和下划线，且以字母开头'),
  type: z.string().min(1, '请选择组织类型'),
  parentId: z.string(),
  description: z.string().trim().max(500, '组织描述不能超过500个字符'),
  effectiveDate: z.date({ message: '请选择生效日期' }),
  leaderId: z.string().optional()
})

type OrganizationFormValues = z.infer<typeof organizationFormSchema>

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value: string): Date {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? TODAY : date
}

function toLeader(leaderId: string | undefined): OrganizationLeader | undefined {
  if (!leaderId) return undefined
  const user = organizationUsers.find((item) => item.id === leaderId)
  if (!user) return undefined
  return {
    id: user.id,
    name: user.name,
    title: user.title,
    avatar: user.avatar,
    email: user.email,
    phone: user.phone,
    online: true
  }
}

export function OrganizationActionSheet({
  currentRow,
  open,
  onOpenChange
}: OrganizationActionSheetProps) {
  const {
    addOrganization,
    updateOrganization,
    hasOrganizationCode,
    getParentOptions,
    currentNode,
    rootOrganization
  } = useOrganizations()
  const isEdit = Boolean(currentRow)
  const [effectiveDateOpen, setEffectiveDateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parentOptions = useMemo(() => {
    const options = getParentOptions(isEdit ? currentRow?.id : undefined)
    if (isEdit) return options
    return options.filter((option) => allowedChildTypes(option.type).length > 0)
  }, [getParentOptions, isEdit, currentRow?.id])

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: '',
      code: '',
      type: ORG_TYPES.DEPARTMENT,
      parentId: rootOrganization?.id ?? '',
      description: '',
      effectiveDate: TODAY,
      leaderId: undefined
    }
  })

  const parentId = useWatch({ control: form.control, name: 'parentId' })
  const selectedParent = parentOptions.find((option) => option.id === parentId)
  const childTypes = useMemo(() => {
    if (isEdit && currentRow && !currentRow.parentId) {
      return [currentRow.type]
    }
    if (isEdit && currentRow) {
      const options = allowedChildTypes(selectedParent?.type ?? ORG_TYPES.GROUP)
      if (!options.includes(currentRow.type as (typeof options)[number])) {
        return [currentRow.type, ...options]
      }
      return options.length ? options : [currentRow.type]
    }
    return selectedParent ? allowedChildTypes(selectedParent.type) : [ORG_TYPES.DEPARTMENT]
  }, [isEdit, currentRow, selectedParent])

  useEffect(() => {
    if (!open) return

    if (currentRow) {
      form.reset({
        name: currentRow.name,
        code: currentRow.code,
        type: currentRow.type,
        parentId: currentRow.parentId ?? '',
        description: currentRow.description,
        effectiveDate: parseDate(currentRow.effectiveDate),
        leaderId: currentRow.leader?.id
      })
    } else {
      const preferred = currentNode ?? rootOrganization
      const parent =
        preferred && allowedChildTypes(preferred.type).length > 0
          ? preferred
          : parentOptions[0] ?? rootOrganization
      const nextTypes = parent ? allowedChildTypes(parent.type) : [ORG_TYPES.DEPARTMENT]
      form.reset({
        name: '',
        code: '',
        type: nextTypes[0] ?? ORG_TYPES.DEPARTMENT,
        parentId: parent?.id ?? '',
        description: '',
        effectiveDate: TODAY,
        leaderId: undefined
      })
    }

    setEffectiveDateOpen(false)
    setIsSubmitting(false)
  }, [open, currentRow, currentNode, rootOrganization, parentOptions, form])

  useEffect(() => {
    if (!open || isEdit) return
    if (!childTypes.length) return
    const currentType = form.getValues('type')
    if (!childTypes.includes(currentType as (typeof childTypes)[number])) {
      form.setValue('type', childTypes[0])
    }
  }, [open, isEdit, childTypes, form])

  const isRootEdit = isEdit && !currentRow?.parentId

  const handleCreateSubmit = (values: OrganizationFormValues) => {
    const code = values.code.trim()
    if (hasOrganizationCode(code)) {
      form.setError('code', { message: '组织编码已存在' })
      return
    }
    if (!values.parentId) {
      form.setError('parentId', { message: '请选择上级组织' })
      return
    }

    setIsSubmitting(true)
    try {
      const created = addOrganization({
        name: values.name.trim(),
        code,
        type: values.type,
        parentId: values.parentId,
        description: values.description.trim(),
        effectiveDate: formatDate(values.effectiveDate),
        leader: toLeader(values.leaderId)
      })
      toast.success(`成功新建组织「${created.name}」`)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSubmit = (values: OrganizationFormValues) => {
    if (!currentRow) return

    if (!isRootEdit && !values.parentId) {
      form.setError('parentId', { message: '请选择上级组织' })
      return
    }

    setIsSubmitting(true)
    try {
      const updated = updateOrganization(currentRow.id, {
        name: values.name.trim(),
        type: values.type,
        parentId: isRootEdit ? '' : values.parentId,
        description: values.description.trim(),
        effectiveDate: formatDate(values.effectiveDate),
        leader: currentRow.leader
      })
      toast.success(`已更新组织「${updated?.name ?? values.name.trim()}」`)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>
            <span className="flex items-center gap-2">
              <Building2 className="size-5" />
              {isEdit ? '编辑组织' : '新增组织'}
            </span>
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? '更新组织基础信息。编码创建后不可修改。'
              : '仅填写基础信息，成员与岗位可在组织详情中配置。'}
          </SheetDescription>
        </SheetHeader>

        <form
          id="organization-action-form"
          className="flex-1 overflow-y-auto px-4"
          onSubmit={form.handleSubmit(isEdit ? handleUpdateSubmit : handleCreateSubmit)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="organization-name">组织名称</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="organization-name"
                      placeholder="例如：平台研发部"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="organization-code">组织编码</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="organization-code"
                      className="font-mono"
                      placeholder="例如：dept_platform"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                      disabled={isEdit}
                      readOnly={isEdit}
                    />
                    {isEdit ? <FieldDescription>创建后不可修改。</FieldDescription> : null}
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="parentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="organization-parent">上级组织</FieldLabel>
                  <FieldContent>
                    {isRootEdit ? (
                      <>
                        <Input id="organization-parent" value="无（根节点）" readOnly disabled />
                        <FieldDescription>根节点无上级组织。</FieldDescription>
                      </>
                    ) : (
                      <>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="organization-parent" className="w-full">
                            <SelectValue placeholder="选择上级组织" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {parentOptions.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                  {option.name} · {getOrganizationTypeLabel(option.type)}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          {currentNode && !isEdit
                            ? `默认挂载到当前选中的「${currentNode.name}」下。`
                            : '未选中节点时默认挂载到根节点下。'}
                        </FieldDescription>
                      </>
                    )}
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="type"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="organization-type">组织类型</FieldLabel>
                  <FieldContent>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="organization-type" className="w-full">
                        <SelectValue placeholder="选择组织类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {childTypes.map((option) => (
                            <SelectItem key={option} value={option}>
                              {getOrganizationTypeLabel(option)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>可选类型由上级组织层级决定。</FieldDescription>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="effectiveDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="organization-effective-date">生效日期</FieldLabel>
                  <FieldContent>
                    <Popover open={effectiveDateOpen} onOpenChange={setEffectiveDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="organization-effective-date"
                          type="button"
                          variant="outline"
                          aria-invalid={fieldState.invalid}
                          className="w-full justify-between font-normal"
                        >
                          {field.value ? DATE_FORMATTER.format(field.value) : '选择生效日期'}
                          <CalendarIcon data-icon="inline-end" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (!date) return
                            field.onChange(date)
                            setEffectiveDateOpen(false)
                          }}
                          captionLayout="dropdown"
                          defaultMonth={field.value}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />

            {!isEdit ? (
              <Controller
                name="leaderId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="organization-leader">负责人</FieldLabel>
                    <FieldContent>
                      <OrganizationLeaderSelect
                        id="organization-leader"
                        value={field.value}
                        onValueChange={(user) => field.onChange(user.id)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>电话与邮箱将同步自用户资料。</FieldDescription>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </FieldContent>
                  </Field>
                )}
              />
            ) : null}

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="organization-description">描述说明</FieldLabel>
                  <FieldContent>
                    <Textarea
                      {...field}
                      id="organization-description"
                      rows={4}
                      placeholder="说明该组织的职责与范围"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="submit" form="organization-action-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            {isEdit ? '保存' : '创建组织'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
