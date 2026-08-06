import {
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Switch
} from '@zen/ui'

import { SectionContent } from '../components/section-content'

export function SettingsNotifications() {
  return (
    <SectionContent>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>邮箱通知</FieldLegend>

          <FieldGroup className="max-w-sm">
            <Field className="border p-4 rounded-lg" orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="switch-share">通讯邮件</FieldLabel>
                <FieldDescription>接收有关您帐户活动的电子邮件。</FieldDescription>
              </FieldContent>
              <Switch id="switch-share" />
            </Field>
            <Field className="border p-4 rounded-lg" orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="switch-notifications">安全电子邮件</FieldLabel>
                <FieldDescription>接收有关您的帐户活动和安全的电子邮件。</FieldDescription>
              </FieldContent>
              <Switch id="switch-notifications" defaultChecked />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>短信通知</FieldLegend>

          <FieldGroup className="max-w-sm">
            <Field className="border p-4 rounded-lg" orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="switch-share">任务提醒</FieldLabel>
                <FieldDescription>接收有关您任务的提醒。</FieldDescription>
              </FieldContent>
              <Switch id="switch-share" />
            </Field>
          </FieldGroup>
        </FieldSet>

        <Field orientation="horizontal">
          <Button>更新通知</Button>
        </Field>
      </FieldGroup>
    </SectionContent>
  )
}
