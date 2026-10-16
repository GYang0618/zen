import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zen/ui'

import { AuthBrand } from '../auth-brand'
import { ForgotPasswordForm } from './forgot-password-form'

export function ForgotPassword() {
  return (
    <div className="w-sm flex flex-col gap-4">
      <AuthBrand />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">忘记密码</CardTitle>
          <CardDescription>请输入您使用的电子邮箱， 我们将向您发送重置密码的链接。</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
