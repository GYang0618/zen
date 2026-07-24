import { Button, Label, Skeleton, Switch } from '@zen/ui'
import { useEffect, useState } from 'react'

import { SettingsPageHeader } from '@/features/settings/components/settings-page-header'
import { SettingsShell } from '@/features/settings/components/settings-shell'
import { useMeQuery, useUpdateMeMutation } from '@/features/settings/queries'

type NotifyChannel = {
  key: 'email' | 'push' | 'sms'
  title: string
  description: string
}

const CHANNELS: NotifyChannel[] = [
  {
    key: 'email',
    title: '邮件通知',
    description: '通过注册邮箱接收安全预警、账单与系统消息。'
  },
  {
    key: 'push',
    title: '推送通知',
    description: '在已登录客户端接收实时推送提醒。'
  },
  {
    key: 'sms',
    title: '短信通知',
    description: '高风险操作或异地登录时通过短信触达（可能产生费用）。'
  }
]

export function NotificationsPage() {
  const { data: me, isLoading } = useMeQuery()
  const updateMe = useUpdateMeMutation()

  const [email, setEmail] = useState(true)
  const [push, setPush] = useState(true)
  const [sms, setSms] = useState(false)

  useEffect(() => {
    if (!me) return
    setEmail(me.preferences.notifications.email)
    setPush(me.preferences.notifications.push)
    setSms(me.preferences.notifications.sms)
  }, [me])

  const values = { email, push, sms } as const
  const setters = {
    email: setEmail,
    push: setPush,
    sms: setSms
  } as const

  return (
    <SettingsShell>
      <SettingsPageHeader
        title="通知与消息偏好"
        description="控制系统通知推送渠道，选择希望接收提醒的方式。"
      />

      <form
        className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs"
        onSubmit={(event) => {
          event.preventDefault()
          updateMe.mutate({
            preferences: {
              notifyByEmail: email,
              notifyByPush: push,
              notifyBySms: sms
            }
          })
        }}
      >
        <div className="space-y-6 p-6">
          <h3 className="text-base font-semibold">推送渠道</h3>

          {isLoading || !me ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {CHANNELS.map((channel, index) => (
                <div
                  key={channel.key}
                  className={
                    index === 0
                      ? 'flex items-center justify-between gap-4'
                      : 'flex items-center justify-between gap-4 border-t border-border pt-4'
                  }
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={`notify-${channel.key}`} className="text-sm font-medium">
                      {channel.title}
                    </Label>
                    <p className="text-xs text-muted-foreground">{channel.description}</p>
                  </div>
                  <Switch
                    id={`notify-${channel.key}`}
                    checked={values[channel.key]}
                    onCheckedChange={setters[channel.key]}
                    aria-label={channel.title}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end bg-muted/40 px-6 py-3.5">
          <Button type="submit" disabled={updateMe.isPending || isLoading}>
            {updateMe.isPending ? '保存中…' : '保存通知偏好'}
          </Button>
        </div>
      </form>
    </SettingsShell>
  )
}
