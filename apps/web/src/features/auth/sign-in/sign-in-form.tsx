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
import { isAuthMfaChallenge } from '@zen/shared'
import { Loader2, LogIn } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { PasswordInput } from '@/components'
import { useI18nStore } from '@/stores/i18n'

import { useSignInMutation, useVerifyMfaMutation } from '../mutations'
import { ThirdPartyLogin } from '../third-party-login'

const formSchema = z.object({
  identifier: z.string().trim().min(1, '输入您的账号'),
  password: z.string().min(1, '密码不能为空')
})

type FormValues = z.infer<typeof formSchema>

export function SignInForm() {
  const { mutate: signIn, isPending, error } = useSignInMutation()
  const verifyMfa = useVerifyMfaMutation()
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/sign-in' })
  const t = useI18nStore((state) => state.t)
  const [mfaToken, setMfaToken] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: '',
      password: ''
    }
  })

  const finishLogin = (session: { mustChangePassword?: boolean; user: { nickname: string | null; username: string } }) => {
    toast.success(`${t('auth.welcome')}，${session.user.nickname || session.user.username}👋🎉`, {
      duration: 2000,
      position: 'top-center'
    })
    if (session.mustChangePassword) {
      navigate({ to: '/change-password', replace: true })
      return
    }
    if (search.redirect) {
      navigate({ to: search.redirect })
      return
    }
    navigate({ to: '/' })
  }

  const onSubmit = (data: FormValues) => {
    signIn(data, {
      onSuccess: (result) => {
        if (isAuthMfaChallenge(result)) {
          setMfaToken(result.mfaToken)
          toast.message('请输入 MFA 验证码')
          return
        }
        finishLogin(result)
      }
    })
  }

  if (mfaToken) {
    return (
      <form
        className="p-6 md:p-8"
        onSubmit={(event) => {
          event.preventDefault()
          verifyMfa.mutate(
            { mfaToken, code: mfaCode.trim() },
            {
              onSuccess: finishLogin,
              onError: (err) => toast.error(err.message || '验证失败')
            }
          )
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">MFA 验证</h1>
            <p className="text-sm text-muted-foreground">请输入身份验证器中的 6 位验证码</p>
          </div>
          <Field>
            <FieldLabel htmlFor="mfa">验证码</FieldLabel>
            <Input
              id="mfa"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              maxLength={8}
              required
            />
          </Field>
          <Button type="submit" disabled={verifyMfa.isPending || !mfaCode.trim()}>
            {verifyMfa.isPending ? <Loader2 className="animate-spin" /> : <LogIn />}
            验证并登录
          </Button>
          <Button type="button" variant="ghost" onClick={() => setMfaToken(null)}>
            返回
          </Button>
        </FieldGroup>
      </form>
    )
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
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="password">密码</FieldLabel>
                <Link to="/forgot-password" className="text-xs text-muted-foreground underline">
                  忘记密码？
                </Link>
              </div>
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
