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

export function SignUpForm() {
  return (
    <form className="p-6 md:p-8">
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">创建你的账户</h1>
          <p className="text-sm text-balance text-muted-foreground">在下方输入邮箱来创建账户</p>
        </div>
        <Field>
          <FieldLabel htmlFor="username">用户名</FieldLabel>
          <Input id="username" type="text" required minLength={3} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">邮箱</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required />

          <FieldDescription>
            我们将使用该邮箱与你联系，不会向任何其他人分享你的邮箱。
          </FieldDescription>
        </Field>
        <Field>
          <Field className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="password">密码</FieldLabel>
              <Input id="password" type="password" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">确认密码</FieldLabel>
              <Input id="confirm-password" type="password" required />
            </Field>
          </Field>
          <FieldDescription>密码长度至少为 8 位。</FieldDescription>
        </Field>

        <Field>
          <Button type="submit">创建账户</Button>
        </Field>
        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
          或使用以下方式继续
        </FieldSeparator>
        <ThirdPartyLogin />
        <FieldDescription className="text-center">
          已有账户？
          <Link to="/sign-in">登录</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
