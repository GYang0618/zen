import type { UpdateMyProfile } from '@zen/shared'

export type ProfileFormSnapshot = {
  nickname: string
  phone: string
  bio: string
  birthday: string | null
  hasAvatar: boolean
}

export type ProfileFormDraft = {
  nickname: string
  phone: string
  bio: string
  birthday: string | null
  hasAvatarFile: boolean
  avatarRemoved: boolean
}

function normalizeText(value: string) {
  return value.trim()
}

function assignIfChanged(
  payload: UpdateMyProfile,
  key: 'phoneNumber' | 'bio',
  previous: string,
  next: string
) {
  const normalizedPrevious = normalizeText(previous)
  const normalizedNext = normalizeText(next)
  if (normalizedPrevious === normalizedNext) return
  payload[key] = normalizedNext || null
}

export function formatBirthday(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseBirthday(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

/**
 * 比较个人资料草稿与当前快照，只产出真正变更的 PATCH 字段。
 * 新头像走独立上传接口，不进入 payload；清空昵称无法落库，不算可提交变更。
 */
export function buildProfileUpdate(
  snapshot: ProfileFormSnapshot,
  draft: ProfileFormDraft
): { payload: UpdateMyProfile; isDirty: boolean } {
  const payload: UpdateMyProfile = {}

  const nextNickname = normalizeText(draft.nickname)
  const previousNickname = normalizeText(snapshot.nickname)
  if (nextNickname && nextNickname !== previousNickname) {
    payload.nickname = nextNickname
  }

  assignIfChanged(payload, 'phoneNumber', snapshot.phone, draft.phone)
  assignIfChanged(payload, 'bio', snapshot.bio, draft.bio)

  if (draft.birthday !== snapshot.birthday) {
    payload.birthday = draft.birthday
  }

  if (draft.avatarRemoved && snapshot.hasAvatar && !draft.hasAvatarFile) {
    payload.avatar = null
  }

  return {
    payload,
    isDirty: draft.hasAvatarFile || Object.keys(payload).length > 0
  }
}
