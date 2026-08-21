import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@zen/ui'
import { Copy, Loader2, Mail, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PasswordInput } from '@/components'
import {
  buildInviteSetPasswordUrl,
  buildMockInviteToken,
  sendMockUserInviteEmail
} from '@/features/auth/user-invite'

import { getUserDisplayName } from '../utils'

import type { CreateUserResult } from '@zen/shared'

type InviteStatus = 'idle' | 'sending' | 'sent'

type UserCreateInvitePanelProps = {
  result: CreateUserResult
}

async function copyText(value: string, successLabel: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`已复制${successLabel}`)
  } catch {
    toast.error('复制失败，请手动选择')
  }
}

export function UserCreateInvitePanel({ result }: UserCreateInvitePanelProps) {
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>('idle')
  const displayName = getUserDisplayName(result)
  const mockToken = buildMockInviteToken(result.id)
  const inviteUrl = buildInviteSetPasswordUrl(
    typeof window === 'undefined' ? '' : window.location.origin,
    mockToken
  )

  const handleSendInvite = async () => {
    setInviteStatus('sending')
    try {
      await sendMockUserInviteEmail()
      setInviteStatus('sent')
      toast.success('邀请邮件已模拟发送')
    } catch {
      setInviteStatus('idle')
      toast.error('模拟发送失败，请重试')
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <Alert>
        <Mail className="size-4" />
        <AlertTitle>账号已开通，等待用户设密</AlertTitle>
        <AlertDescription>
          临时密码仅展示一次。用户可通过邀请链接设密，或使用临时密码首次登录后再改。接入邮箱后两条路径并存：邮件中改密会取消首次强制改密；未改则登录后仍须修改。
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border p-3">
        <p className="font-medium">{displayName}</p>
        <p className="text-sm text-muted-foreground">
          {result.username} · {result.email}
        </p>
      </div>

      <Field>
        <FieldLabel htmlFor="created-temp-password">临时密码</FieldLabel>
        <FieldContent>
          <div className="flex gap-2">
            <PasswordInput
              id="created-temp-password"
              value={result.initialPassword}
              readOnly
              autoComplete="off"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="复制临时密码"
              onClick={() => copyText(result.initialPassword, '临时密码')}
            >
              <Copy />
            </Button>
          </div>
          <FieldDescription>
            关闭后无法再次查看。请通过安全渠道交给用户。若未在邀请邮件中设密，首次登录仍须修改。
          </FieldDescription>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>邀请邮件</FieldLabel>
        <FieldContent className="gap-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant={inviteStatus === 'sent' ? 'secondary' : 'outline'}>
              {inviteStatus === 'sent' ? '已发送（模拟）' : '未发送'}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={inviteStatus === 'sending'}
              onClick={() => void handleSendInvite()}
            >
              {inviteStatus === 'sending' ? <Loader2 className="animate-spin" /> : <Mail />}
              {inviteStatus === 'sent' ? '再次模拟发送' : '发送邀请邮件'}
            </Button>
          </div>
          <FieldDescription>
            当前为前端模拟，不会真正发信。接入邮件后，此操作将投递带设密链接的邀请函。
          </FieldDescription>
        </FieldContent>
      </Field>

      {inviteStatus === 'sent' ? (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MailCheck className="size-4" />
            模拟邮件预览
          </div>
          <p className="text-sm text-muted-foreground">
            收件人 {result.email}
            <br />
            主题 邀请你设置登录密码
          </p>
          <Field>
            <FieldLabel htmlFor="created-invite-url">设密链接</FieldLabel>
            <FieldContent>
              <InputGroup>
                <InputGroupInput
                  id="created-invite-url"
                  value={inviteUrl}
                  readOnly
                  autoComplete="off"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="复制设密链接"
                    onClick={() => copyText(inviteUrl, '设密链接')}
                  >
                    <Copy />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>
                打开链接可预览设密页。模拟提交不会写入服务器；接入邮箱后将调用重置密码接口并清除强制改密。
              </FieldDescription>
            </FieldContent>
          </Field>
          <Button type="button" variant="secondary" asChild>
            <a href={inviteUrl} target="_blank" rel="noreferrer">
              打开设密页
            </a>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
