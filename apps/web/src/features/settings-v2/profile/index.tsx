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
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

import { useAuthStore } from '@/stores'

import { SectionContent } from '../components/section-content'
import { ProfilePhotoField } from './profile-photo-field'

const BIRTHDAY_START_MONTH = new Date(1925, 0)
const BIRTHDAY_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

export function SettingsProfile() {
  const user = useAuthStore((state) => state.user)
  const fallbackLabel = user?.nickname ?? user?.username ?? '用户'
  const [birthday, setBirthday] = useState<Date>()
  const [birthdayOpen, setBirthdayOpen] = useState(false)

  return (
    <SectionContent>
      <FieldGroup>
        <ProfilePhotoField initialSrc={user?.avatar ?? undefined} fallbackLabel={fallbackLabel} />
        <Field>
          <FieldLabel htmlFor="nickname">昵称</FieldLabel>
          <Input id="nickname" type="text" placeholder="您的昵称" />
          <FieldDescription>这是将显示在您的个人资料及电子邮件中的名称。</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="username">用户名</FieldLabel>
          <Input id="username" type="text" placeholder="admin" />
          <FieldDescription>
            这是您的公开显示名称。既可以是您的真实姓名，也可以是化名。每 30 天仅可更改一次。
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="email">电子邮件</FieldLabel>
          <Input id="email" type="email" placeholder="example@domain.com" />
          <FieldDescription>
            这是您将用于登录的电子邮件地址，同时接收重要消息提醒。
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">手机号</FieldLabel>
          <Input id="phone" type="tel" placeholder="11位数字" />
          <FieldDescription>这是您将用于登录的手机号，同时接收短信消息提醒。</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="birthday">生日</FieldLabel>

          <Popover open={birthdayOpen} onOpenChange={setBirthdayOpen}>
            <PopoverTrigger asChild>
              <Button
                id="birthday"
                type="button"
                variant="outline"
                data-empty={!birthday}
                className="justify-between font-normal data-[empty=true]:text-muted-foreground"
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

          <FieldDescription>您的出生日期用于计算您的年龄。</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="bio">个人简介</FieldLabel>
          <Textarea id="bio" placeholder="我是A部门的技术经理" />
          <FieldDescription>您可以使用 @ 符号提及其他用户和组织，从而建立链接。</FieldDescription>
        </Field>
        <Field orientation="horizontal">
          <Button type="submit">更新个人资料</Button>
        </Field>
      </FieldGroup>
    </SectionContent>
  )
}
