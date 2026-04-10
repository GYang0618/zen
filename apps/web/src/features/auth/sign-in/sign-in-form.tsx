import { Link } from '@tanstack/react-router'
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  Input
} from '@zen/ui'
import { ThirdPartyLogin } from '../third-party-login'

export function SignInForm() {
  return (
    <form className="p-6 md:p-8">
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">欢迎回来</h1>
          <p className="text-balance text-muted-foreground">登录你的 Acme Inc 账户</p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">邮箱</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">密码</FieldLabel>
            <a href="/" className="ml-auto text-sm underline-offset-2 hover:underline">
              忘记密码？
            </a>
          </div>
          <Input id="password" type="password" required />
        </Field>

        <Field>
          <Button type="submit">登录</Button>
        </Field>
        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
          或使用以下方式继续
        </FieldSeparator>
        <ThirdPartyLogin />
        <FieldDescription className="text-center">
          还没有账户？<Link to="/sign-up">注册</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
