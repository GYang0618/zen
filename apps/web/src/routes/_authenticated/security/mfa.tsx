import { createFileRoute } from '@tanstack/react-router'
import { Button, Input } from '@zen/ui'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { authApi } from '@/features/auth/api'

export const Route = createFileRoute('/_authenticated/security/mfa')({
  component: MfaSecurityPage,
  staticData: {
    title: '多因子认证',
    icon: 'shield',
    group: '系统管理',
    order: 55,
    hideInMenu: false
  }
})

function MfaSecurityPage() {
  const [secret, setSecret] = useState<string | null>(null)
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main className="flex max-w-xl flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">多因子认证 (TOTP)</h2>
          <p className="text-muted-foreground">使用身份验证器应用绑定二次验证</p>
        </div>
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <Button
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
          {secret ? (
            <div className="space-y-2 text-sm">
              <p className="break-all font-mono">密钥：{secret}</p>
              {otpauthUrl ? <p className="break-all text-muted-foreground">{otpauthUrl}</p> : null}
            </div>
          ) : null}
          <Input
            placeholder="6 位验证码"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={8}
          />
          <div className="flex gap-2">
            <Button
              disabled={pending || !code.trim()}
              onClick={async () => {
                setPending(true)
                try {
                  await authApi.enableMfa(code.trim())
                  toast.success('MFA 已启用')
                  setCode('')
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
      </Main>
    </>
  )
}
