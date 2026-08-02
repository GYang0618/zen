import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Input,
  Label,
  Separator,
  Skeleton,
  Textarea
} from '@zen/ui'
import { Briefcase, Building2, CheckCircle2, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AppPageHeader } from '@/components/layouts/app-page-header'
import { SettingsShell } from '@/features/settings/components/settings-shell'
import { useMeQuery, useUpdateMeMutation } from '@/features/settings/queries'

function getInitials(value: string) {
  const normalized = value.trim()
  if (!normalized) return 'U'
  const parts = normalized.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
  }
  return normalized.slice(0, 2).toUpperCase()
}

export function ProfilePage() {
  const { data: me, isLoading } = useMeQuery()
  const updateMe = useUpdateMeMutation()

  const [nickname, setNickname] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')

  useEffect(() => {
    if (!me) return
    setNickname(me.profile.nickname ?? '')
    setPhoneNumber(me.contact.phoneNumber ?? '')
    setBio(me.remark ?? '')
    setAvatar(me.profile.avatar ?? '')
  }, [me])

  const displayName = me?.profile.nickname || me?.profile.username || '—'
  const roleNames =
    me?.auth.roleDetails.map((role) => role.name).filter(Boolean) ?? me?.auth.roles ?? []
  const primaryOrg = me?.organizations.find((item) => item.isPrimary) ?? me?.organizations[0]
  const orgLabel =
    [me?.org.deptName, primaryOrg?.organizationName].filter(Boolean).join(' / ') ||
    primaryOrg?.organizationName ||
    me?.org.deptName ||
    null

  return (
    <SettingsShell>
      <div className="flex flex-col gap-6 pb-6">
        <AppPageHeader
          title="个人资料"
          description="管理您的个人身份标识、展示名称、头像及公开联系方式。"
        />
        <Separator />
      </div>

      {isLoading || !me ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : (
        <form
          className="space-y-8"
          onSubmit={(event) => {
            event.preventDefault()
            updateMe.mutate({
              nickname: nickname.trim() || undefined,
              phoneNumber: phoneNumber.trim() ? phoneNumber.trim() : null,
              bio: bio.trim() ? bio.trim() : null,
              avatar: avatar.trim() ? avatar.trim() : null
            })
          }}
        >
          {/* Avatar Preview & Base Info Header */}
          <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between bg-card/50">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border border-border shadow-xs">
                <AvatarImage src={avatar || undefined} alt={displayName} />
                <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">{displayName}</h3>
                  <Badge variant="secondary" className="font-mono text-xs">
                    @{me.profile.username}
                  </Badge>
                  {me.account.isVerified && (
                    <Badge
                      variant="outline"
                      className="gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    >
                      <CheckCircle2 className="size-3" />
                      已验证
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {roleNames.map((name) => (
                    <span key={name} className="inline-flex items-center gap-1">
                      <Shield className="size-3" /> {name}
                    </span>
                  ))}
                  {orgLabel && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="size-3" /> {orgLabel}
                    </span>
                  )}
                  {me.org.jobTitle && (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="size-3" /> {me.org.jobTitle}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form Fields */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" value={me.profile.username} disabled className="bg-muted/50" />
              <p className="text-[0.8rem] text-muted-foreground">
                这是您在系统内的公共识别凭证，不可变更。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">显示名称 / 昵称</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
                placeholder="例如：张三"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                这是您在团队界面、协作列表及日志中公开显示的姓名。
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">电子邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={me.contact.email}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-[0.8rem] text-muted-foreground">用于接收重要消息提醒。</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">联系手机</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+86 13800000000"
                />
                <p className="text-[0.8rem] text-muted-foreground">选填，用于安全紧急触达。</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">头像图片 URL</Label>
              <Input
                id="avatar"
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                提供公网可访问的图片链接以替换默认头像。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">个人简介 / 备注</Label>
              <Textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                className="resize-none"
                placeholder="填写一句话简介，展示在组织成员名片中…"
              />
              <p className="text-[0.8rem] text-muted-foreground">简短描述，字数上限 160 字。</p>
            </div>
          </div>

          <Button type="submit" disabled={updateMe.isPending}>
            {updateMe.isPending ? '保存中…' : '更新个人资料'}
          </Button>
        </form>
      )}
    </SettingsShell>
  )
}
