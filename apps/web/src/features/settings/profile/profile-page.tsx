import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Input,
  Label,
  Skeleton,
  Textarea
} from '@zen/ui'
import { Briefcase, Building2, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'

import { SettingsPageHeader } from '@/features/settings/components/settings-page-header'
import { SettingsShell } from '@/features/settings/components/settings-shell'
import { useMeQuery, useUpdateMeMutation } from '@/features/settings/queries'

function getInitials(value: string) {
  const normalized = value.trim()
  if (!normalized) return '—'
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
      <SettingsPageHeader
        title="个人资料"
        description="管理您的个人身份信息、系统角色及联系方式。"
      />

      {isLoading || !me ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Avatar className="size-20 ring-2 ring-border">
                <AvatarImage src={avatar || undefined} alt={displayName} />
                <AvatarFallback className="text-lg">{getInitials(displayName)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">{displayName}</h2>
                  <Badge variant="secondary">@{me.profile.username}</Badge>
                  {me.account.isVerified ? (
                    <Badge
                      variant="outline"
                      className="gap-1.5 text-emerald-700 dark:text-emerald-400"
                    >
                      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                      已认证
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {roleNames.map((name) => (
                    <Badge key={name} variant="outline" className="gap-1.5 font-medium">
                      <Shield className="size-3 text-muted-foreground" aria-hidden />
                      {name}
                    </Badge>
                  ))}
                  {orgLabel ? (
                    <Badge variant="outline" className="gap-1.5 font-medium">
                      <Building2 className="size-3 text-muted-foreground" aria-hidden />
                      {orgLabel}
                    </Badge>
                  ) : null}
                  {me.org.jobTitle ? (
                    <Badge variant="outline" className="gap-1.5 font-medium">
                      <Briefcase className="size-3 text-muted-foreground" aria-hidden />
                      {me.org.jobTitle}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <form
            className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs"
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
            <div className="space-y-4 p-6">
              <h3 className="text-base font-semibold">详细联系信息</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nickname">昵称</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={50}
                    placeholder="显示名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input id="username" value={me.profile.username} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" type="email" value={me.contact.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">联系手机</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+86 ..."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="avatar">头像 URL</Label>
                  <Input
                    id="avatar"
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="bio">个人简介</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  className="resize-none"
                  placeholder="简短介绍，将显示在团队协作与审批列表中"
                />
                <p className="text-xs text-muted-foreground">上限 160 字。</p>
              </div>
            </div>

            <div className="flex items-center justify-end bg-muted/40 px-6 py-3.5">
              <Button type="submit" disabled={updateMe.isPending}>
                {updateMe.isPending ? '保存中…' : '保存基本信息'}
              </Button>
            </div>
          </form>
        </>
      )}
    </SettingsShell>
  )
}
