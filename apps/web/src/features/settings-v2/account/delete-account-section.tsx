import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Input
} from '@zen/ui'
import { Trash2 } from 'lucide-react'

import { PasswordInput } from '@/components'

const CONFIRM_TEXT = '删除我的账户'

export function DeleteAccountSection() {
  return (
    <FieldSet>
      <FieldLegend>删除账户</FieldLegend>
      <FieldDescription>
        永久删除账户及关联数据。此操作不可撤销，请在确认前备份重要信息。
      </FieldDescription>

      <Field orientation="responsive">
        <FieldContent>
          <FieldTitle>永久删除此账户</FieldTitle>
          <FieldDescription>
            删除后，个人资料、登录凭证、会话记录与相关配置将一并清除，且无法恢复。
          </FieldDescription>
        </FieldContent>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive">
              <Trash2 data-icon="inline-start" />
              删除账户
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除账户？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作不可撤销。请输入登录密码，并在下方输入「{CONFIRM_TEXT}」以继续。
              </AlertDialogDescription>
            </AlertDialogHeader>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="delete-account-password">登录密码</FieldLabel>
                <PasswordInput
                  id="delete-account-password"
                  autoComplete="current-password"
                  placeholder="输入当前登录密码"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="delete-account-confirm">确认文案</FieldLabel>
                <Input
                  id="delete-account-confirm"
                  type="text"
                  autoComplete="off"
                  placeholder={CONFIRM_TEXT}
                />
                <FieldDescription>请完整输入「{CONFIRM_TEXT}」以确认你了解后果。</FieldDescription>
              </Field>
            </FieldGroup>

            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction variant="destructive">确认删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Field>
    </FieldSet>
  )
}
