import { Button } from '@zen/ui'
import { RefreshCw } from 'lucide-react'
import { useRef } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { LoginEventTable } from './components/login-event-table'

export function LoginLogsPage() {
  const refetchRef = useRef<(() => void) | null>(null)

  return (
    <>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader
          title="登录日志"
          description="监控系统用户登录、登出、认证授权与失败锁定事件"
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => refetchRef.current?.()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </Button>
          }
        />

        <LoginEventTable
          onRefetchReady={(fn) => {
            refetchRef.current = fn
          }}
        />
      </Main>
    </>
  )
}
