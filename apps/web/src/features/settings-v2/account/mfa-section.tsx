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
import { Copy, ShieldCheck, ShieldOff } from 'lucide-react'
import { useState } from 'react'

const DEMO_SECRET = 'JBSWY3DPEHPK3PXP'

export function MfaSection() {
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [enableOpen, setEnableOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

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
              <div className="flex aspect-square max-w-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
                二维码预览区
              </div>
              <FieldDescription>
                使用验证器应用扫描上方二维码，或手动输入下方密钥。
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>手动输入密钥</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  readOnly
                  value={DEMO_SECRET}
                  className="font-mono text-xs"
                  aria-label="MFA 密钥"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton type="button" size="icon-xs" aria-label="复制密钥">
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
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEnableOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              onClick={() => {
                setMfaEnabled(true)
                setEnableOpen(false)
              }}
            >
              确认启用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              onClick={() => {
                setMfaEnabled(false)
                setDisableOpen(false)
              }}
            >
              确认关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
