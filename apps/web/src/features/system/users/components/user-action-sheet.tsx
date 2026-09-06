import { useForm, useStore } from '@tanstack/react-form'
import {
  Button,
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
import { Check, Loader2, UserRoundPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { genderOptions } from '../data/data'
import { useCreateUserMutation, useUpdateUserMutation } from '../mutations'
import { useRoleOptionsQuery } from '../queries'
import { UserCreateInvitePanel } from './user-create-invite-panel'
import { UserMembershipFields } from './user-membership-fields'
import { UserRolePicker } from './user-role-picker'

import type { CreateUserResult, User } from '@zen/shared'

interface UserActionSheetProps {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

const optionalText = z.string().trim()

const userFormSchema = z.object({
  username: z.string().trim().min(3, '用户名至少需要3个字符').max(30, '用户名不能超过30个字符'),
  email: z.email('无效的邮箱格式'),
  realName: optionalText.max(50, '真实姓名不能超过50个字符'),
  nickname: optionalText.max(50, '昵称不能超过50个字符'),
  phoneNumber: optionalText.max(20, '手机号码不能超过20个字符'),
  gender: z.enum(['male', 'female', 'unknown']),
  remark: optionalText.max(500, '备注不能超过500个字符'),
  organizationId: z.string(),
  postId: z.string(),
  roleIds: z.array(z.string())
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
  const [createdResult, setCreatedResult] = useState<CreateUserResult | null>(null)
  const { mutate: createUser, isPending: isCreating } = useCreateUserMutation()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUserMutation()
  const isSubmitting = isCreating || isUpdating
  const { data: rolesPage } = useRoleOptionsQuery(open)
  const roles = rolesPage?.items ?? []

  const form = useForm({
    defaultValues: defaultValues as UserFormValues,
    validators: { onChange: userFormSchema },
    onSubmit: async ({ value }) => {
      await (isEdit ? handleUpdateSubmit : handleCreateSubmit)(userFormSchema.parse(value))
    }
  })
  const organizationId = useStore(form.store, (state) => state.values.organizationId)
  const postId = useStore(form.store, (state) => state.values.postId)

  const defaultUserRoleId = useMemo(
    () => roles.find((role) => role.code === 'user')?.id ?? '',
    [roles]
  )

  useEffect(() => {
    if (!open) {
      setCreatedResult(null)
      return
    }
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
    createUser(
      {
        username: values.username.trim(),
        email: values.email.trim(),
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
        onSuccess: (result) => {
          setCreatedResult(result)
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
              {createdResult ? <Check className="size-5" /> : <UserRoundPlus className="size-5" />}
              {isEdit ? '编辑用户' : createdResult ? '用户已创建' : '新增用户'}
            </span>
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? '更新用户资料。用户名不可修改，密码请使用重置密码。'
              : createdResult
                ? '请复制临时密码，或模拟发送邀请邮件。关闭后无法再次查看临时密码。'
                : '填写账号与资料。系统将生成临时密码，可通过邀请邮件或首次登录设密。'}
          </SheetDescription>
        </SheetHeader>

        {createdResult ? (
          <div className="flex-1 overflow-y-auto">
            <UserCreateInvitePanel result={createdResult} />
          </div>
        ) : (
          <form
            id="user-action-form"
            className="flex-1 overflow-y-auto px-4"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void form.handleSubmit()
            }}
          >
            <FieldGroup>
              <form.Field name="username">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid}>
                    <FieldLabel htmlFor="user-username">用户名</FieldLabel>
                    <FieldContent>
                      <Input
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        id="user-username"
                        placeholder="登录账号"
                        autoComplete="off"
                        disabled={isEdit}
                        readOnly={isEdit}
                        aria-invalid={!field.state.meta.isValid}
                      />
                      {isEdit ? <FieldDescription>创建后不可修改。</FieldDescription> : null}
                      {!field.state.meta.isValid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid}>
                    <FieldLabel htmlFor="user-email">邮箱</FieldLabel>
                    <FieldContent>
                      <Input
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        id="user-email"
                        placeholder="name@example.com"
                        autoComplete="off"
                        aria-invalid={!field.state.meta.isValid}
                      />
                      {!field.state.meta.isValid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="realName">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid}>
                    <FieldLabel htmlFor="user-real-name">真实姓名</FieldLabel>
                    <FieldContent>
                      <Input
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        id="user-real-name"
                        placeholder="例如：张三"
                        aria-invalid={!field.state.meta.isValid}
                      />
                      {!field.state.meta.isValid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="nickname">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid}>
                    <FieldLabel htmlFor="user-nickname">昵称</FieldLabel>
                    <FieldContent>
                      <Input
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        id="user-nickname"
                        placeholder="显示名称（可选）"
                        aria-invalid={!field.state.meta.isValid}
                      />
                      {!field.state.meta.isValid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="phoneNumber">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid}>
                    <FieldLabel htmlFor="user-phone">手机号</FieldLabel>
                    <FieldContent>
                      <Input
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        id="user-phone"
                        placeholder="可选"
                        aria-invalid={!field.state.meta.isValid}
                      />
                      {!field.state.meta.isValid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="gender">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid}>
                    <FieldLabel htmlFor="user-gender">性别</FieldLabel>
                    <FieldContent>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(userFormSchema.shape.gender.parse(value))
                        }
                      >
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
                      {!field.state.meta.isValid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              {!isEdit ? (
                <>
                  <Field>
                    <FieldLabel>主职组织</FieldLabel>
                    <FieldContent>
                      <UserMembershipFields
                        organizationId={organizationId}
                        postId={postId}
                        onOrganizationChange={(value) =>
                          form.setFieldValue('organizationId', value)
                        }
                        onPostChange={(value) => form.setFieldValue('postId', value)}
                        disabled={isSubmitting}
                      />
                      <FieldDescription>可稍后在用户详情中调整兼职组织。</FieldDescription>
                    </FieldContent>
                  </Field>

                  <form.Field name="roleIds">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="user-roles">初始角色</FieldLabel>
                        <FieldContent>
                          {roles.length === 0 ? (
                            <p className="text-sm text-muted-foreground">暂无可用角色</p>
                          ) : (
                            <UserRolePicker
                              id="user-roles"
                              roles={roles}
                              value={field.state.value}
                              onValueChange={field.handleChange}
                              disabled={isSubmitting}
                            />
                          )}
                          <FieldDescription>未选择时将分配默认 user 角色。</FieldDescription>
                        </FieldContent>
                      </Field>
                    )}
                  </form.Field>
                </>
              ) : null}

              <form.Field name="remark">
                {(field) => (
                  <Field data-invalid={!field.state.meta.isValid}>
                    <FieldLabel htmlFor="user-remark">备注</FieldLabel>
                    <FieldContent>
                      <Textarea
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        id="user-remark"
                        rows={3}
                        placeholder="可选说明"
                        aria-invalid={!field.state.meta.isValid}
                      />
                      {!field.state.meta.isValid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </form>
        )}

        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          {createdResult ? (
            <Button type="button" onClick={() => onOpenChange(false)}>
              完成
            </Button>
          ) : (
            <>
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
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
