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
import { z } from 'zod'

import {
  allowedChildTypes,
  getOrganizationTypeLabel,
  ORG_TYPES,
  ROOT_ORGANIZATION_TYPES
} from '../data/data'
import { useOrganizations } from '../organizations-provider'
import { OrganizationLeaderSelect } from './organization-leader-select'
import { OrganizationParentSelect } from './organization-parent-select'

import type { OrganizationType } from '@zen/shared'
import type { Organization } from '../type'

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
    organizations
  } = useOrganizations()
  const isEdit = Boolean(currentRow)
  const [effectiveDateOpen, setEffectiveDateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parentOptions = useMemo(() => {
    const options = getParentOptions(isEdit ? currentRow?.id : undefined)
    if (isEdit) return options
    return options.filter((option) => allowedChildTypes(option.type).length > 0)
  }, [getParentOptions, isEdit, currentRow?.id])

  const selectableParentIds = useMemo(
    () => new Set(parentOptions.map((option) => option.id)),
    [parentOptions]
  )

  const parentExcludeIds = useMemo(() => {
    if (!isEdit || !currentRow) return undefined
    return new Set([currentRow.id])
  }, [currentRow, isEdit])

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: '',
      code: '',
      type: ORG_TYPES.DEPARTMENT,
      parentId: '',
      description: '',
      effectiveDate: TODAY,
      leaderId: undefined
    }
  })

  const parentId = useWatch({ control: form.control, name: 'parentId' })
  const selectedParent = parentOptions.find((option) => option.id === parentId)
  const isRootEdit = isEdit && !currentRow?.parentId

  const childTypes = useMemo(() => {
    if (isRootEdit && currentRow) {
      return [currentRow.type]
    }

    const baseTypes = selectedParent
      ? allowedChildTypes(selectedParent.type)
      : ROOT_ORGANIZATION_TYPES

    if (
      isEdit &&
      currentRow &&
      !baseTypes.includes(currentRow.type as (typeof baseTypes)[number])
    ) {
      return [currentRow.type, ...baseTypes]
    }

    if (baseTypes.length) return baseTypes
    return isEdit && currentRow ? [currentRow.type] : [ORG_TYPES.DEPARTMENT]
  }, [isRootEdit, isEdit, currentRow, selectedParent])

  useEffect(() => {
    if (!open) return

    if (currentRow) {
      form.reset({
        name: currentRow.name,
        code: currentRow.code,
        type: currentRow.type,
        parentId: currentRow.parentId ?? '',
        description: currentRow.description ?? '',
        effectiveDate: parseDate(currentRow.effectiveDate),
        leaderId: currentRow.leader?.id
      })
    } else {
      const parent =
        currentNode && allowedChildTypes(currentNode.type).length > 0 ? currentNode : null
      const nextTypes = parent ? allowedChildTypes(parent.type) : ROOT_ORGANIZATION_TYPES
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
  }, [open, currentRow, currentNode, form])

  useEffect(() => {
    if (!open || isEdit) return
    if (!childTypes.length) return
    const currentType = form.getValues('type')
    if (!childTypes.includes(currentType as (typeof childTypes)[number])) {
      form.setValue('type', childTypes[0])
    }
  }, [open, isEdit, childTypes, form])

  const handleCreateSubmit = async (values: OrganizationFormValues) => {
    const code = values.code.trim()
    if (hasOrganizationCode(code)) {
      form.setError('code', { message: '组织编码已存在' })
      return
    }

    setIsSubmitting(true)
    try {
      await addOrganization({
        name: values.name.trim(),
        code,
        type: values.type as OrganizationType,
        parentId: values.parentId.trim() ? values.parentId : null,
        description: values.description.trim(),
        effectiveDate: formatDate(values.effectiveDate),
        leaderId: values.leaderId ?? null
      })
      onOpenChange(false)
    } catch {
      // mutation toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSubmit = async (values: OrganizationFormValues) => {
    if (!currentRow) return

    setIsSubmitting(true)
    try {
      await updateOrganization(currentRow.id, {
        name: values.name.trim(),
        type: values.type as OrganizationType,
        parentId: isRootEdit ? null : values.parentId.trim() ? values.parentId : null,
        description: values.description.trim(),
        effectiveDate: formatDate(values.effectiveDate)
      })
      onOpenChange(false)
    } catch {
      // mutation toast
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
                        <OrganizationParentSelect
                          id="organization-parent"
                          value={field.value}
                          onValueChange={field.onChange}
                          tree={organizations}
                          excludeIds={parentExcludeIds}
                          selectableIds={selectableParentIds}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldDescription>
                          {currentNode && !isEdit
                            ? `默认挂载到当前选中的「${currentNode.name}」下，清空后将新建为根节点。`
                            : '留空将新建为根节点，可选类型为集团、公司或中心。'}
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
