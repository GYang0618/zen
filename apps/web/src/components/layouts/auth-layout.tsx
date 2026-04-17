import { Outlet } from '@tanstack/react-router'
import { Card, CardContent, cn, FieldDescription } from '@zen/ui'

export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className={cn('flex flex-col gap-6')}>
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <Outlet />
              <div className="relative md:flex items-center  hidden  bg-linear-to-br from-indigo-500 to-purple-600 text-white">
                <div className="max-w-md space-y-6 p-10">
                  <h1 className="text-4xl font-bold">Shadcn Admin </h1>
                  <p className="text-lg opacity-80">构建智能化的AI驱动管理系统。</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            点击继续，即表示你同意我们的<a href="/"> 服务条款 </a>和<a href="/"> 隐私政策 </a>。
          </FieldDescription>
        </div>
      </div>
    </div>
  )
}
