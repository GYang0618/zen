import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  Input
} from '@zen/ui'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'

import { useSignInMutation } from '../mutations'
import { ThirdPartyLogin } from '../third-party-login'

const formSchema = z.object({
  identifier: z.string().trim().min(1, '请输入您的账号').max(30, '账号长度不能超过 30 位'),
  password: z
    .string()
    .min(1, '请输入您的密码')
    .min(8, '密码长度至少 8 位')
    .max(64, '密码长度不能超过 64 位')
    .regex(/[A-Z]/, '必须包含至少一个大写字母')
    .regex(/[a-z]/, '必须包含至少一个小写字母')
    .regex(/[0-9]/, '必须包含至少一个数字')
    .regex(/[^A-Za-z0-9]/, '必须包含至少一个特殊字符')
})

type FormValues = z.infer<typeof formSchema>

export function SignInForm() {
  const { mutate: signIn } = useSignInMutation()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: '',
      password: ''
    }
  })

  const onSubmit = (data: FormValues) => {
    signIn(data, {
      onSuccess: () => {
        console.log('登录成功')
      }
    })
  }

  return (
    <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">欢迎回来👏</h1>
          <p className="text-balance text-muted-foreground">登录你的 Acme Inc 账户</p>
        </div>

        <Controller
          name="identifier"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="identifier">账号</FieldLabel>
              <Input {...field} id="identifier" placeholder="用户名/邮箱/手机号" />
              {fieldState.error && <FieldError errors={[fieldState.error]}></FieldError>}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="password">密码</FieldLabel>
              <Input {...field} id="password" type="password" placeholder="••••••••" />
              {fieldState.error && <FieldError errors={[fieldState.error]}></FieldError>}
            </Field>
          )}
        />

        <Field>
          <Button type="submit">登录</Button>
        </Field>
        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
          其他方式
        </FieldSeparator>
        <ThirdPartyLogin />
        <FieldDescription className="text-center">
          还没有账户？<Link to="/sign-up">注册</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
