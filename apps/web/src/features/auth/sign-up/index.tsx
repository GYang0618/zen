import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldDescription
} from '@zen/ui'

import { AuthBrand } from '../auth-brand'
import { SignUpForm } from './sign-up-form'

export function SignUp() {
  return (
    <div className="w-md flex flex-col gap-4">
      <AuthBrand />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">创建账户</CardTitle>
          <CardDescription>输入您的电子邮件和密码以创建账户</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        创建账户，即表示您同意我们的<a href="/"> 服务条款 </a>和<a href="/"> 隐私政策 </a>。
      </FieldDescription>
    </div>
  )
}
