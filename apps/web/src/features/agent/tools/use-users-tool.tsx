import { useFrontendTool } from '@copilotkit/react-core/v2'
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

const userFormSchema = z.object({
  username: z.string().trim().min(3, '用户名至少需要3个字符').max(30, '用户名不能超过30个字符'),
  email: z.email('无效的邮箱格式'),
  realName: z.string().trim().max(50, '真实姓名不能超过50个字符'),
  nickname: z.string().trim().max(50, '昵称不能超过50个字符'),
  phoneNumber: z.string().trim().max(20, '手机号码不能超过20个字符'),
  gender: z.enum(['male', 'female', 'unknown']),
  remark: z.string().trim().max(500, '备注不能超过500个字符')
})

export function useUsersTool() {
  useFrontendTool({
    name: 'user_create_form',
    description:
      '当用户需要创建用户时，但又没有输入任何新用户信息时，显示用户创建表单，引导用户填写用户信息',
    parameters: userFormSchema,
    render: () => <UserForm />
  })
}

function UserForm() {
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      realName: '',
      nickname: '',
      phoneNumber: '',
      gender: 'unknown',
      remark: ''
    },
    validators: { onChange: userFormSchema },
    onSubmit: async ({ value }) => {
      console.log(value)
    }
  })

  const genderOptions = [
    { value: 'unknown', label: '保密' },
    { value: 'male', label: '男' },
    { value: 'female', label: '女' }
  ]

  return (
    <Card>
      <CardContent>
        <form
          id="user-create-form"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup className="px-4">
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
      <CardFooter>
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
  )
}
