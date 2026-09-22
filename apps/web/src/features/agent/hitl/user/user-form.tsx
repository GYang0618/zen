import { useForm } from '@tanstack/react-form'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@zen/ui'
import z from 'zod'

import { registerChatSurfaceTool } from '../../lib/group-tool-calls'

const COLLECT_NEW_USER_FORM_TOOL = 'collect_new_user_form'

registerChatSurfaceTool(COLLECT_NEW_USER_FORM_TOOL)

const userFormSchema = z.object({
  username: z.string().trim().min(3, '用户名至少需要3个字符').max(30, '用户名不能超过30个字符'),
  email: z.email('无效的邮箱格式'),
  realName: z.string().trim().max(50, '真实姓名不能超过50个字符'),
  nickname: z.string().trim().max(50, '昵称不能超过50个字符'),
  phoneNumber: z.string().trim().max(20, '手机号码不能超过20个字符'),
  gender: z.enum(['male', 'female', 'unknown'])
})

type UserFormValues = z.infer<typeof userFormSchema>

interface UserFormProps {
  onSubmit: (values: UserFormValues) => void
}

export function UserForm({ onSubmit }: UserFormProps) {
  const defaultValues: UserFormValues = {
    username: '',
    email: '',
    realName: '',
    nickname: '',
    phoneNumber: '',
    gender: 'unknown'
  }

  const form = useForm({
    defaultValues,
    validators: { onChange: userFormSchema },
    onSubmit: ({ value }) => onSubmit(userFormSchema.parse(value))
  })

  const genderOptions = [
    { value: 'unknown', label: '保密' },
    { value: 'male', label: '男' },
    { value: 'female', label: '女' }
  ]

  return (
    <div className="p-1">
      <Card className="@container w-full">
        <CardContent>
          <form
            id="user-create-form"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup className="grid grid-cols-1 gap-4 px-4 @sm:grid-cols-2 @2xl:grid-cols-3">
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
                        aria-invalid={!field.state.meta.isValid}
                      />
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
                        items={genderOptions}
                        value={field.state.value}
                        onValueChange={(value) => {
                          if (!value) return
                          field.handleChange(userFormSchema.shape.gender.parse(value))
                        }}
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
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="bg-transparent justify-end">
          <Field orientation="horizontal">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              重置
            </Button>
            <Button type="submit" form="user-create-form">
              提交
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  )
}
