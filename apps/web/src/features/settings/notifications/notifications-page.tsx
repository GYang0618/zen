import { Button, Label, Separator, Skeleton, Switch } from '@zen/ui'
import { useEffect, useState } from 'react'

import { AppPageHeader } from '@/components/layouts/app-page-header'
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
    description: '通过绑定的注册邮箱接收安全预警、重要异动与通知。'
  },
  {
    key: 'push',
    title: '推送通知',
    description: '在已登录的浏览器客户端接收实时消息推送。'
  },
  {
    key: 'sms',
    title: '短信通知',
    description: '进行高风险敏感操作或异常登录时触发短信触达。'
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
      <div className="flex flex-col gap-6 pb-6">
        <AppPageHeader />
        <Separator />
      </div>

      {isLoading || !me ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : (
        <form
          className="space-y-8"
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
          <div className="space-y-4 rounded-lg border p-4">
            {CHANNELS.map((channel, index) => (
              <div
                key={channel.key}
                className={
                  index === 0
                    ? 'flex items-center justify-between gap-4'
                    : 'flex items-center justify-between gap-4 border-t pt-4'
                }
              >
                <div className="space-y-0.5">
                  <Label htmlFor={`notify-${channel.key}`} className="text-sm font-medium">
                    {channel.title}
                  </Label>
                  <p className="text-[0.8rem] text-muted-foreground">{channel.description}</p>
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

          <Button type="submit" disabled={updateMe.isPending || isLoading}>
            {updateMe.isPending ? '保存中…' : '保存通知设置'}
          </Button>
        </form>
      )}
    </SettingsShell>
  )
}
