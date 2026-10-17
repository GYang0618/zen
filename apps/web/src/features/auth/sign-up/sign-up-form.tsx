import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  Input,
  sleep,
  toast
} from '@zen/ui'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'

import { handleFieldBlurValidate, validateConfirmPassword } from '@/lib/form/field-validation'

import { useSignUpMutation } from '../mutations'
import { ThirdPartyLogin } from '../third-party-login'

const signUpFieldsSchema = z.object({
  username: z
    .string()
    .min(1, { error: '请输入您的用户名', abort: true })
    .min(3, { error: '用户名至少 3 位', abort: true })
    .max(20, { error: '用户名不能超过 20 位', abort: true })
    .regex(/^[a-zA-Z0-9_]+$/, { error: '只能包含字母、数字、下划线', abort: true }),
  email: z.email({
    error: ({ input }) => (input === '' ? '请输入你的邮箱' : '无效的邮箱地址')
  }),
  password: z
    .string()
    .min(1, { error: '请输入您的密码', abort: true })
    .min(8, { error: '密码长度至少 8 位', abort: true })
    .max(64, { error: '密码长度不能超过 64 位', abort: true })
    .regex(/[A-Z]/, { error: '必须包含至少一个大写字母', abort: true })
    .regex(/[a-z]/, { error: '必须包含至少一个小写字母', abort: true })
    .regex(/[0-9]/, { error: '必须包含至少一个数字', abort: true })
    .regex(/[^A-Za-z0-9]/, {
      error: '必须包含至少一个特殊字符',
      abort: true
    }),
  confirmPassword: z.string().min(1, '请确认密码')
})

const formSchema = signUpFieldsSchema.refine((data) => data.password === data.confirmPassword, {
  error: '两次输入的密码不一致',
  path: ['confirmPassword']
})

type FormValues = z.infer<typeof formSchema>

export function SignUpForm() {
  const { mutate: signUp, isPending } = useSignUpMutation()
  const navigate = useNavigate()
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    } as FormValues,
    onSubmit: async ({ value }) => {
      await onSubmit(formSchema.parse(value))
    }
  })

  const onSubmit = ({ confirmPassword: _, ...data }: FormValues) => {
    signUp(data, {
      onSuccess: () => {
        toast.promise(sleep(1000), {
          loading: '账户创建成功！自动登录中...',
          success: () => {
            navigate({ to: '/' })
            return '登录成功，欢迎加入我们👏'
          },
          error: '自动登录失败，请稍后重试'
        })
      }
    })
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field name="username" validators={{ onChange: signUpFieldsSchema.shape.username }}>
          {(field) => (
            <Field>
              <FieldLabel htmlFor="username">用户名</FieldLabel>
              <Input
                name={field.name}
                value={field.state.value}
                onBlur={() => handleFieldBlurValidate(field)}
                onChange={(event) => field.handleChange(event.target.value)}
                id="username"
                type="text"
                placeholder="输入用户名，只包含字母、数字、下划线"
              />
              {field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        </form.Field>

        <form.Field name="email" validators={{ onChange: signUpFieldsSchema.shape.email }}>
          {(field) => (
            <Field>
              <FieldLabel htmlFor="email">邮箱</FieldLabel>
              <Input
                name={field.name}
                value={field.state.value}
                onBlur={() => handleFieldBlurValidate(field)}
                onChange={(event) => field.handleChange(event.target.value)}
                id="email"
                placeholder="name@example.com"
              />
              {field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        </form.Field>

        <Field>
          <Field className="grid grid-cols-2 gap-4">
            <form.Field
              name="password"
              validators={{ onChange: signUpFieldsSchema.shape.password }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={() => handleFieldBlurValidate(field)}
                    onChange={(event) => field.handleChange(event.target.value)}
                    id="password"
                    type="password"
                    autoComplete="true"
                    placeholder="••••••••"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              )}
            </form.Field>
            <form.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ['password'],
                onChange: validateConfirmPassword
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="confirm-password">确认密码</FieldLabel>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={() => handleFieldBlurValidate(field)}
                    onChange={(event) => field.handleChange(event.target.value)}
                    id="confirm-password"
                    type="password"
                    autoComplete="true"
                    placeholder="••••••••"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              )}
            </form.Field>
          </Field>
        </Field>

        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            创建账户
          </Button>
        </Field>
        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
          或使用以下方式继续
        </FieldSeparator>
        <ThirdPartyLogin disabled={isPending} />
        <FieldDescription className="text-center">
          已有账户？<Link to="/sign-in">登录</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
