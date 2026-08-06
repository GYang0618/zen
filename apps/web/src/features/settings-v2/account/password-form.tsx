import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@zen/ui'

import { PasswordInput } from '@/components'

export function PasswordForm() {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
      }}
    >
      <FieldSet>
        <FieldLegend>登录密码</FieldLegend>
        <FieldDescription>定期更新密码有助于保护账户安全。</FieldDescription>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="current-password">当前密码</FieldLabel>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              placeholder="输入当前登录密码"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="new-password">新密码</FieldLabel>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              placeholder="设置符合安全规范的新密码"
            />
            <FieldDescription>至少 8 位，须包含大小写字母、数字与特殊字符。</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">确认新密码</FieldLabel>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              placeholder="再次输入新密码"
            />
          </Field>

          <Field orientation="horizontal">
            <Button type="submit">更新密码</Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  )
}
