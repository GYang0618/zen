import { useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Input, Label, Skeleton } from '@zen/ui'
import { useState } from 'react'
import { toast } from 'sonner'

import { authApi } from '@/features/auth/api'
import { settingsKeys, useMeQuery } from '@/features/settings/queries'

export function MfaSection() {
  const queryClient = useQueryClient()
  const { data: me, isLoading } = useMeQuery()
  const mfaEnabled = me?.security.mfaEnabled ?? false

  const [secret, setSecret] = useState<string | null>(null)
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [configuring, setConfiguring] = useState(false)

  const refreshMe = async () => {
    await queryClient.invalidateQueries({ queryKey: settingsKeys.me() })
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
      {isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">双重验证 (2FA / TOTP)</h3>
                <Badge variant={mfaEnabled ? 'default' : 'secondary'}>
                  {mfaEnabled ? '已开启' : '未开启'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {mfaEnabled
                  ? '已绑定 Authenticator 动态口令验证器。可重新配置或关闭双重验证。'
                  : '使用身份验证器应用绑定二次验证，提升账户安全等级。'}
              </p>
            </div>
            {!configuring ? (
              <Button
                type="button"
                variant="outline"
                className="shrink-0 self-start"
                onClick={() => setConfiguring(true)}
              >
                {mfaEnabled ? '管理 2FA' : '前往设置'}
              </Button>
            ) : null}
          </div>

          {configuring ? (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={pending}
                  onClick={async () => {
                    setPending(true)
                    try {
                      const result = await authApi.setupMfa()
                      setSecret(result.secret)
                      setOtpauthUrl(result.otpauthUrl)
                      toast.success('已生成密钥，请扫码后输入验证码启用')
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : '生成失败')
                    } finally {
                      setPending(false)
                    }
                  }}
                >
                  生成绑定密钥
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    setConfiguring(false)
                    setSecret(null)
                    setOtpauthUrl(null)
                    setCode('')
                  }}
                >
                  取消
                </Button>
              </div>

              {secret ? (
                <div className="space-y-2 text-sm">
                  <p className="break-all font-mono">密钥：{secret}</p>
                  {otpauthUrl ? (
                    <p className="break-all text-muted-foreground">{otpauthUrl}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="mfa-code">6 位验证码</Label>
                <Input
                  id="mfa-code"
                  placeholder="输入验证器中的验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={8}
                  autoComplete="one-time-code"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={pending || !code.trim()}
                  onClick={async () => {
                    setPending(true)
                    try {
                      await authApi.enableMfa(code.trim())
                      toast.success('MFA 已启用')
                      setCode('')
                      setSecret(null)
                      setOtpauthUrl(null)
                      setConfiguring(false)
                      await refreshMe()
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : '启用失败')
                    } finally {
                      setPending(false)
                    }
                  }}
                >
                  启用 MFA
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || !code.trim()}
                  onClick={async () => {
                    setPending(true)
                    try {
                      await authApi.disableMfa(code.trim())
                      toast.success('MFA 已关闭')
                      setSecret(null)
                      setOtpauthUrl(null)
                      setCode('')
                      setConfiguring(false)
                      await refreshMe()
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : '关闭失败')
                    } finally {
                      setPending(false)
                    }
                  }}
                >
                  关闭 MFA
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
