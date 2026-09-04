import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@zen/ui'
import { Copy, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  useDisableMfaMutation,
  useEnableMfaMutation,
  useMeQuery,
  useSetupMfaMutation
} from '../queries'

export function MfaSection() {
  const { data: me } = useMeQuery()
  const mfaEnabled = me?.security.mfaEnabled ?? false

  const [enableOpen, setEnableOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)
  const [enableCode, setEnableCode] = useState('')
  const [disableCode, setDisableCode] = useState('')

  const setupMfa = useSetupMfaMutation()
  const enableMfa = useEnableMfaMutation()
  const disableMfa = useDisableMfaMutation()

  // biome-ignore lint/correctness/useExhaustiveDependencies: 仅在打开启用弹窗时发起 setup，避免 mutate 引用变化重复请求
  useEffect(() => {
    if (enableOpen) {
      setEnableCode('')
      setupMfa.mutate()
    }
  }, [enableOpen])

  useEffect(() => {
    if (disableOpen) {
      setDisableCode('')
    }
  }, [disableOpen])

  const handleCopySecret = () => {
    if (setupMfa.data?.secret) {
      void navigator.clipboard.writeText(setupMfa.data.secret)
      toast.info('密钥已复制')
    }
  }

  const handleEnable = () => {
    if (!enableCode.trim()) return
    enableMfa.mutate(enableCode.trim(), {
      onSuccess: () => setEnableOpen(false)
    })
  }

  const handleDisable = () => {
    if (!disableCode.trim()) return
    disableMfa.mutate(disableCode.trim(), {
      onSuccess: () => setDisableOpen(false)
    })
  }

  return (
    <>
      <FieldSet>
        <FieldLegend>双重验证</FieldLegend>
        <FieldDescription>
          使用 Authenticator 应用生成的一次性验证码，在登录时增加第二道防护。
        </FieldDescription>

        <Field orientation="responsive">
          <FieldContent>
            <div className="flex flex-wrap items-center gap-2">
              <FieldTitle>Authenticator（TOTP）</FieldTitle>
              <Badge variant={mfaEnabled ? 'default' : 'secondary'}>
                {mfaEnabled ? '已开启' : '未开启'}
              </Badge>
            </div>
            <FieldDescription>
              {mfaEnabled
                ? '已绑定 TOTP 验证器。关闭前需输入当前验证码。'
                : '推荐使用 Google Authenticator、Microsoft Authenticator 或 1Password 等应用。'}
            </FieldDescription>
          </FieldContent>

          {mfaEnabled ? (
            <Button type="button" variant="outline" onClick={() => setDisableOpen(true)}>
              <ShieldOff data-icon="inline-start" />
              关闭双重验证
            </Button>
          ) : (
            <Button type="button" onClick={() => setEnableOpen(true)}>
              <ShieldCheck data-icon="inline-start" />
              启用双重验证
            </Button>
          )}
        </Field>
      </FieldSet>

      {/* 启用 MFA Dialog */}
      <Dialog open={enableOpen} onOpenChange={setEnableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>启用双重验证</DialogTitle>
            <DialogDescription>
              在验证器应用中添加账户，然后输入当前显示的 6 位验证码以完成绑定。
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>扫码绑定</FieldLabel>
              {setupMfa.isPending ? (
                <div className="flex aspect-square max-w-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : setupMfa.data?.otpauthUrl ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(setupMfa.data.otpauthUrl)}`}
                  alt="MFA 二维码"
                  className="max-w-48 rounded-lg border border-border"
                  width={192}
                  height={192}
                />
              ) : (
                <div className="flex aspect-square max-w-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
                  二维码加载失败
                </div>
              )}
              <FieldDescription>
                使用验证器应用扫描上方二维码，或手动输入下方密钥。
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>手动输入密钥</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  readOnly
                  value={setupMfa.data?.secret ?? ''}
                  className="font-mono text-xs"
                  aria-label="MFA 密钥"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label="复制密钥"
                    onClick={handleCopySecret}
                  >
                    <Copy />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="mfa-enable-code">验证码</FieldLabel>
              <Input
                id="mfa-enable-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={8}
                value={enableCode}
                onChange={(e) => setEnableCode(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEnableOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              disabled={enableCode.trim().length < 6 || enableMfa.isPending}
              onClick={handleEnable}
            >
              {enableMfa.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              确认启用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 关闭 MFA Dialog */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>关闭双重验证</DialogTitle>
            <DialogDescription>
              关闭后，登录将仅需密码。请输入验证器中的当前验证码以确认是您本人操作。
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="mfa-disable-code">验证码</FieldLabel>
              <Input
                id="mfa-disable-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={8}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDisableOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={disableCode.trim().length < 6 || disableMfa.isPending}
              onClick={handleDisable}
            >
              {disableMfa.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              确认关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
