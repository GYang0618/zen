import { useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Calendar,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea
} from '@zen/ui'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { authApi } from '@/features/auth/api'
import { uploadWithIntent } from '@/lib/storage-upload'

import { SectionContent } from '../components/section-content'
import { settingsV2Keys, useApplyMeSession, useMeQuery, useUpdateMeMutation } from '../queries'
import { buildProfileUpdate, formatBirthday, parseBirthday } from './profile-form'
import { ProfilePhotoField } from './profile-photo-field'

const BIRTHDAY_START_MONTH = new Date(1900, 0)
const BIRTHDAY_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

export function SettingsProfile() {
  const queryClient = useQueryClient()
  const { data: me, isLoading } = useMeQuery()
  const applyMeSession = useApplyMeSession()
  const updateMe = useUpdateMeMutation()

  const fallbackLabel = me?.profile.nickname ?? me?.profile.username ?? '用户'

  const [nickname, setNickname] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [birthday, setBirthday] = useState<Date>()
  const [birthdayOpen, setBirthdayOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!me) return
    setNickname(me.profile.nickname ?? '')
    setUsername(me.profile.username)
    setEmail(me.contact.email)
    setPhone(me.contact.phoneNumber ?? '')
    setBio(me.remark ?? '')
    setBirthday(me.profile.birthday ? parseBirthday(me.profile.birthday) : undefined)
  }, [me])

  const { payload, isDirty } = me
    ? buildProfileUpdate(
        {
          nickname: me.profile.nickname ?? '',
          phone: me.contact.phoneNumber ?? '',
          bio: me.remark ?? '',
          birthday: me.profile.birthday,
          hasAvatar: Boolean(me.profile.avatar)
        },
        {
          nickname,
          phone,
          bio,
          birthday: birthday ? formatBirthday(birthday) : null,
          hasAvatarFile: avatarFile !== null,
          avatarRemoved
        }
      )
    : { payload: {}, isDirty: false }

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file)
    setAvatarRemoved(file === null)
  }

  const refreshMeAfterAvatar = async () => {
    const nextMe = await queryClient.fetchQuery({
      queryKey: settingsV2Keys.me(),
      queryFn: () => authApi.getMe()
    })
    applyMeSession(nextMe)
    toast.success('已保存')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isDirty) return

    setSubmitting(true)
    const selectedFile = avatarFile
    let stage: 'upload' | 'patch' | 'refresh' = 'upload'
    try {
      if (selectedFile) {
        await uploadWithIntent({
          file: selectedFile,
          purpose: 'avatar',
          endpoint: 'avatar'
        })
        setAvatarFile(null)
      }

      if (Object.keys(payload).length > 0) {
        stage = 'patch'
        await updateMe.mutateAsync(payload)
        setAvatarRemoved(false)
        return
      }

      if (selectedFile) {
        stage = 'refresh'
        await refreshMeAfterAvatar()
      }
    } catch (error) {
      if (stage === 'patch') return
      toast.error(
        error instanceof Error ? error.message : stage === 'upload' ? '头像上传失败' : '保存失败'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <SectionContent>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </SectionContent>
    )
  }

  return (
    <SectionContent>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <ProfilePhotoField
            initialSrc={me?.profile.avatar ?? undefined}
            fallbackLabel={fallbackLabel}
            onFileChange={handleAvatarChange}
          />
          <Field>
            <FieldLabel htmlFor="nickname">昵称</FieldLabel>
            <Input
              id="nickname"
              type="text"
              placeholder="您的昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <FieldDescription>这是将显示在您的个人资料及电子邮件中的名称。</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="username">用户名</FieldLabel>
            <Input id="username" type="text" placeholder="admin" value={username} disabled />
            <FieldDescription>
              这是您的公开显示名称。既可以是您的真实姓名，也可以是化名。每 30 天仅可更改一次。
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">电子邮件</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="example@domain.com"
              value={email}
              disabled
            />
            <FieldDescription>
              这是您将用于登录的电子邮件地址，同时接收重要消息提醒。
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">手机号</FieldLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="11位数字"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <FieldDescription>这是您将用于登录的手机号，同时接收短信消息提醒。</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="birthday">生日</FieldLabel>

            <div className="flex items-center gap-2">
              <Popover open={birthdayOpen} onOpenChange={setBirthdayOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="birthday"
                    type="button"
                    variant="outline"
                    data-empty={!birthday}
                    className="flex-1 justify-between font-normal data-[empty=true]:text-muted-foreground"
                  >
                    {birthday ? BIRTHDAY_FORMATTER.format(birthday) : '选择您的出生日期'}
                    <CalendarIcon data-icon="inline-start" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthday}
                    onSelect={(date) => {
                      setBirthday(date)
                      setBirthdayOpen(false)
                    }}
                    captionLayout="dropdown"
                    startMonth={BIRTHDAY_START_MONTH}
                    endMonth={new Date()}
                    disabled={{ after: new Date() }}
                    defaultMonth={birthday ?? new Date(1995, 0)}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="ghost"
                disabled={!birthday}
                onClick={() => setBirthday(undefined)}
              >
                清除
              </Button>
            </div>

            <FieldDescription>您的出生日期用于计算您的年龄。</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="bio">个人简介</FieldLabel>
            <Textarea
              id="bio"
              placeholder="我是A部门的技术经理"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <FieldDescription>您可以使用 @ 符号提及其他用户和组织，从而建立链接。</FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <Button type="submit" disabled={!isDirty || submitting || updateMe.isPending}>
              {submitting || updateMe.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              更新个人资料
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </SectionContent>
  )
}
