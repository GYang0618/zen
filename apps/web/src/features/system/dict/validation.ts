import { createDictionarySchema } from '@zen/shared'

import type { DictionaryItem } from '@zen/shared'

export type DictionaryBasicField = 'name' | 'code' | 'description' | 'folderId'

export function getDictionaryBasicFieldValidationError(
  values: Record<DictionaryBasicField, string>,
  field: DictionaryBasicField
) {
  const result = createDictionarySchema.shape[field].safeParse(values[field])
  return result.success ? undefined : result.error.issues[0]?.message
}

export type DictionaryItemField = 'label' | 'value' | 'description'

export function getDictionaryItemFieldValidationError(
  item: DictionaryItem,
  field: DictionaryItemField
) {
  if (field === 'label') {
    if (!item.label.trim()) return '标签不能为空'
    if (item.label.trim().length > 20) return '标签不能超过20个字'
  }

  if (field === 'value') {
    if (!item.value.trim()) return '值不能为空'
    if (!/^[A-Za-z0-9_]+$/.test(item.value)) return '值只能包含英文字母、数字和下划线'
  }

  if (field === 'description' && (item.description ?? '').trim().length > 50) {
    return '说明不能超过50个字'
  }

  return undefined
}

export function getDictionaryItemValidationError(item: DictionaryItem) {
  return (
    getDictionaryItemFieldValidationError(item, 'label') ??
    getDictionaryItemFieldValidationError(item, 'value') ??
    getDictionaryItemFieldValidationError(item, 'description')
  )
}
