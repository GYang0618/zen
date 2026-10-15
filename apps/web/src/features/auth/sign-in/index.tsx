import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldDescription
} from '@zen/ui'

import { AuthBrand } from '../auth-brand'
import { SignInForm } from './sign-in-form'

export function SignIn() {
  return (
    <div className="w-md  flex flex-col gap-4">
      <AuthBrand />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">登录</CardTitle>
          <CardDescription>请在下方输入您的电子邮件和密码以登录您的账户</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        点击登录，即表示你同意我们的<a href="/"> 服务条款 </a>和<a href="/"> 隐私政策 </a>。
      </FieldDescription>
    </div>
  )
}
