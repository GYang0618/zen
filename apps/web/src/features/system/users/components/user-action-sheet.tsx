import { zodResolver } from '@hookform/resolvers/zod'
import { userPasswordSchema } from '@zen/shared'
import {
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
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
import { Loader2, UserRoundPlus } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { PasswordInput } from '@/components'

import { genderOptions } from '../data/data'
import { useCreateUserMutation, useUpdateUserMutation } from '../mutations'
import { useRoleOptionsQuery } from '../queries'
import { UserMembershipFields } from './user-membership-fields'

import type { User } from '@zen/shared'

interface UserActionSheetProps {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

const optionalText = z.string().trim()

const userFormSchema = z
  .object({
    username: z.string().trim().min(3, '用户名至少需要3个字符').max(30, '用户名不能超过30个字符'),
    email: z.email('无效的邮箱格式'),
    realName: optionalText.max(50, '真实姓名不能超过50个字符'),
    nickname: optionalText.max(50, '昵称不能超过50个字符'),
    phoneNumber: optionalText.max(20, '手机号码不能超过20个字符'),
    gender: z.enum(['male', 'female', 'unknown']),
    remark: optionalText.max(500, '备注不能超过500个字符'),
    password: z.string(),
    confirmPassword: z.string(),
    organizationId: z.string(),
    postId: z.string(),
    roleIds: z.array(z.string())
  })
  .superRefine((data, ctx) => {
    if (!data.password) return
    const parsed = userPasswordSchema.safeParse(data.password)
    if (!parsed.success) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: parsed.error.issues[0]?.message ?? '密码不符合要求'
      })
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: '两次输入的密码不一致'
      })
    }
  })

type UserFormValues = z.infer<typeof userFormSchema>

const defaultValues: UserFormValues = {
  username: '',
  email: '',
  realName: '',
  nickname: '',
  phoneNumber: '',
  gender: 'unknown',
  remark: '',
  password: '',
  confirmPassword: '',
  organizationId: '',
  postId: '',
  roleIds: []
}

function toOptional(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export function UserActionSheet({ currentRow, open, onOpenChange }: UserActionSheetProps) {
  const isEdit = Boolean(currentRow)
  const { mutate: createUser, isPending: isCreating } = useCreateUserMutation()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUserMutation()
  const isSubmitting = isCreating || isUpdating
  const { data: rolesPage } = useRoleOptionsQuery(open)
  const roles = rolesPage?.items ?? []

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues
  })
  const organizationId = useWatch({ control: form.control, name: 'organizationId' })
  const postId = useWatch({ control: form.control, name: 'postId' })
  const selectedRoleIds = useWatch({ control: form.control, name: 'roleIds' })

  const defaultUserRoleId = useMemo(
    () => roles.find((role) => role.code === 'user')?.id ?? '',
    [roles]
  )

  useEffect(() => {
    if (!open) return
    if (currentRow) {
      const primary =
        currentRow.organizations.find((item) => item.isPrimary) ?? currentRow.organizations[0]
      form.reset({
        username: currentRow.username,
        email: currentRow.email,
        realName: currentRow.realName ?? '',
        nickname: currentRow.nickname ?? '',
        phoneNumber: currentRow.phoneNumber ?? '',
        gender: currentRow.gender,
        remark: currentRow.remark ?? '',
        password: '',
        confirmPassword: '',
        organizationId: primary?.organizationId ?? '',
        postId: primary?.postId ?? '',
        roleIds: currentRow.roles.map((role) => role.id)
      })
      return
    }
    form.reset({
      ...defaultValues,
      roleIds: defaultUserRoleId ? [defaultUserRoleId] : []
    })
  }, [open, currentRow, defaultUserRoleId, form])

  const handleCreateSubmit = (values: UserFormValues) => {
    const password = toOptional(values.password)
    if (!password) {
      form.setError('password', { message: '请输入密码' })
      return
    }

    createUser(
      {
        username: values.username.trim(),
        email: values.email.trim(),
        password,
        nickname: toOptional(values.nickname),
        realName: toOptional(values.realName),
        phoneNumber: toOptional(values.phoneNumber),
        gender: values.gender,
        remark: toOptional(values.remark),
        roleIds: values.roleIds.length > 0 ? values.roleIds : undefined,
        organizations: values.organizationId
          ? [
              {
                organizationId: values.organizationId,
                isPrimary: true,
                postId: toOptional(values.postId) ?? null
              }
            ]
          : undefined
      },
      {
        onSuccess: () => {
          toast.success('用户已创建')
          onOpenChange(false)
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : '创建失败')
      }
    )
  }

  const handleUpdateSubmit = (values: UserFormValues) => {
    if (!currentRow) return
    updateUser(
      {
        id: currentRow.id,
        data: {
          email: values.email.trim(),
          nickname: toOptional(values.nickname) ?? null,
          realName: toOptional(values.realName) ?? null,
          phoneNumber: toOptional(values.phoneNumber) ?? null,
          gender: values.gender,
          remark: toOptional(values.remark) ?? null
        }
      },
      {
        onSuccess: () => {
          toast.success('用户资料已更新')
          onOpenChange(false)
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : '更新失败')
      }
    )
  }

  const toggleRole = (roleId: string, checked: boolean) => {
    const next = checked
      ? [...selectedRoleIds, roleId]
      : selectedRoleIds.filter((id) => id !== roleId)
    form.setValue('roleIds', next, { shouldDirty: true })
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
              <UserRoundPlus className="size-5" />
              {isEdit ? '编辑用户' : '新增用户'}
            </span>
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? '更新用户资料。用户名不可修改，密码请使用重置密码。'
              : '填写账号与资料。角色、组织可在此预置，也可稍后在详情中调整。'}
          </SheetDescription>
        </SheetHeader>

        <form
          id="user-action-form"
          className="flex-1 overflow-y-auto px-4"
          onSubmit={form.handleSubmit(isEdit ? handleUpdateSubmit : handleCreateSubmit)}
        >
          <FieldGroup>
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-username">用户名</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="user-username"
                      placeholder="登录账号"
                      autoComplete="off"
                      disabled={isEdit}
                      readOnly={isEdit}
                      aria-invalid={fieldState.invalid}
                    />
                    {isEdit ? <FieldDescription>创建后不可修改。</FieldDescription> : null}
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-email">邮箱</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="user-email"
                      placeholder="name@example.com"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="realName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-real-name">真实姓名</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="user-real-name"
                      placeholder="例如：张三"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="nickname"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-nickname">昵称</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="user-nickname"
                      placeholder="显示名称（可选）"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="phoneNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-phone">手机号</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="user-phone"
                      placeholder="可选"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="gender"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-gender">性别</FieldLabel>
                  <FieldContent>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="user-gender" className="w-full">
                        <SelectValue placeholder="选择性别" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {genderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />

            {!isEdit ? (
              <>
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="user-password">密码</FieldLabel>
                      <FieldContent>
                        <PasswordInput
                          {...field}
                          id="user-password"
                          autoComplete="new-password"
                          placeholder="至少 8 位，含大小写、数字与符号"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </FieldContent>
                    </Field>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="user-confirm-password">确认密码</FieldLabel>
                      <FieldContent>
                        <PasswordInput
                          {...field}
                          id="user-confirm-password"
                          autoComplete="new-password"
                          placeholder="再次输入密码"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </FieldContent>
                    </Field>
                  )}
                />

                <Field>
                  <FieldLabel>主职组织</FieldLabel>
                  <FieldContent>
                    <UserMembershipFields
                      organizationId={organizationId}
                      postId={postId}
                      onOrganizationChange={(value) => form.setValue('organizationId', value)}
                      onPostChange={(value) => form.setValue('postId', value)}
                      disabled={isSubmitting}
                    />
                    <FieldDescription>可稍后在用户详情中调整兼职组织。</FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>初始角色</FieldLabel>
                  <FieldContent>
                    <div className="flex flex-col gap-2 rounded-lg border p-3">
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            id={`create-role-${role.id}`}
                            checked={selectedRoleIds.includes(role.id)}
                            onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
                          />
                          <label
                            htmlFor={`create-role-${role.id}`}
                            className="flex items-center gap-2"
                          >
                            <span>{role.name}</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {role.code}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <FieldDescription>未选择时将分配默认 user 角色。</FieldDescription>
                  </FieldContent>
                </Field>
              </>
            ) : null}

            <Controller
              name="remark"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-remark">备注</FieldLabel>
                  <FieldContent>
                    <Textarea
                      {...field}
                      id="user-remark"
                      rows={3}
                      placeholder="可选说明"
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
          <Button type="submit" form="user-action-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            {isEdit ? '保存' : '创建用户'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
