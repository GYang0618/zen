import { zodResolver } from '@hookform/resolvers/zod'
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
  sleep
} from '@zen/ui'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useSignUpMutation } from '../mutations'
import { ThirdPartyLogin } from '../third-party-login'

const formSchema = z
  .object({
    username: z
      .string()
      .min(1, '请输入您的用户名')
      .min(3, '用户名至少 3 位')
      .max(20, '用户名不能超过 20 位')
      .regex(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字、下划线'),
    email: z.email({
      error: ({ input }) => (input === '' ? '请输入你的邮箱' : '无效的邮箱地址')
    }),
    password: z
      .string()
      .min(1, '请输入您的密码')
      .min(8, '密码长度至少 8 位')
      .max(64, '密码长度不能超过 64 位')
      .regex(/[A-Z]/, '必须包含至少一个大写字母')
      .regex(/[a-z]/, '必须包含至少一个小写字母')
      .regex(/[0-9]/, '必须包含至少一个数字')
      .regex(/[^A-Za-z0-9]/, '必须包含至少一个特殊字符'),
    confirmPassword: z.string().min(1, '请确认密码')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword']
  })

type FormValues = z.infer<typeof formSchema>

export function SignUpForm() {
  const { mutate: signUp, error, isPending } = useSignUpMutation()
  const navigate = useNavigate()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  const onSubmit = ({ confirmPassword: _, ...data }: FormValues) => {
    signUp(data, {
      onSuccess: () => {
        toast.promise(sleep(1000), {
          loading: '账户创建成功！自动登录中...',
          position: 'top-center',
          success: () => {
            navigate({ to: '/' })
            return '登录成功，欢迎加入我们👏'
          }
        })
      }
    })
  }

  return (
    <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">创建你的账户</h1>
          <div className="text-sm text-balance text-muted-foreground">
            {error?.message ? (
              <FieldError errors={[{ message: error.message }]} />
            ) : (
              '在下方输入信息来创建账户'
            )}
          </div>
        </div>

        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="username">用户名</FieldLabel>
              <Input
                {...field}
                id="username"
                type="text"
                placeholder="输入用户名，只包含字母、数字、下划线"
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="email">邮箱</FieldLabel>
              <Input {...field} id="email" placeholder="输入邮箱" />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Field className="grid grid-cols-2 gap-4">
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    autoComplete="true"
                    placeholder="••••••••"
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="confirm-password">确认密码</FieldLabel>
                  <Input
                    {...field}
                    id="confirm-password"
                    type="password"
                    autoComplete="true"
                    placeholder="••••••••"
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
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
