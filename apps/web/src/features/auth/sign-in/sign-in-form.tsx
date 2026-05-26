import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
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
import { Loader2, LogIn } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { PasswordInput } from '@/components'

import { useSignInMutation } from '../mutations'
import { ThirdPartyLogin } from '../third-party-login'

const formSchema = z.object({
  identifier: z.string().trim().min(1, '输入您的账号'),
  password: z.string().min(1, '密码不能为空')
})

type FormValues = z.infer<typeof formSchema>

export function SignInForm() {
  const { mutate: signIn, isPending, error } = useSignInMutation()
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/sign-in' })
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: '',
      password: ''
    }
  })

  const onSubmit = (data: FormValues) => {
    signIn(data, {
      onSuccess: ({ user }) => {
        toast.success(`欢迎回来，${user.nickname}👋🎉`, {
          duration: 2000,
          position: 'top-center'
        })
        if (search.redirect) {
          navigate({ to: search.redirect })
          return
        }
        navigate({ to: '/' })
      }
    })
  }

  return (
    <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">欢迎回来👏</h1>
          <div className="text-balance text-muted-foreground">
            {error?.message ? (
              <FieldError errors={[{ message: error.message }]}></FieldError>
            ) : (
              '登录你的 Zen Admin 账户'
            )}
          </div>
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
              <PasswordInput
                {...field}
                id="password"
                autoComplete="current-password"
                placeholder="••••••••"
              />
              {fieldState.error && <FieldError errors={[fieldState.error]}></FieldError>}
            </Field>
          )}
        />

        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <LogIn />}
            登录
          </Button>
        </Field>
        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
          或使用以下方式继续
        </FieldSeparator>
        <ThirdPartyLogin disabled={isPending} />
        <FieldDescription className="text-center">
          还没有账户？<Link to="/sign-up">注册</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
