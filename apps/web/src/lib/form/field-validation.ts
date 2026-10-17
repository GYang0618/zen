import { z } from 'zod'

type BlurValidatableField = {
  handleBlur: () => void
  validate: (cause: 'change') => unknown
}

/**
 * 失焦时只跑当前字段的 onChange 校验。
 * 不要同时注册 onChange + onBlur 两个 schema 校验器，提交时会各跑一遍导致重复错误。
 */
export function handleFieldBlurValidate(field: BlurValidatableField): void {
  field.handleBlur()
  void field.validate('change')
}

function createConfirmPasswordSchema(password: string) {
  return z
    .string()
    .min(1, { error: '请确认密码', abort: true })
    .refine((value) => value === password, {
      error: '两次输入的密码不一致'
    })
}

/**
 * confirmPassword 字段的 onChange 校验器，需配合 `onChangeListenTo: ['password']` 使用，
 * 以便 password 变化时重新比对。表单中必须存在 `password` 字段。
 */
export function validateConfirmPassword({
  value,
  fieldApi
}: {
  value: string
  fieldApi: { form: { getFieldValue: (name: 'password') => string } }
}) {
  const result = createConfirmPasswordSchema(fieldApi.form.getFieldValue('password')).safeParse(
    value
  )
  return result.success ? undefined : result.error.issues
}
