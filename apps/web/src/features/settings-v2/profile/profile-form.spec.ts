import { describe, expect, it } from 'vitest'

import { buildProfileUpdate, formatBirthday, parseBirthday } from './profile-form'

import type { ProfileFormDraft, ProfileFormSnapshot } from './profile-form'

const SNAPSHOT: ProfileFormSnapshot = {
  nickname: '张三',
  phone: '13800000000',
  bio: '技术经理',
  birthday: '1995-01-15',
  hasAvatar: true
}

const UNCHANGED_DRAFT: ProfileFormDraft = {
  nickname: '张三',
  phone: '13800000000',
  bio: '技术经理',
  birthday: '1995-01-15',
  hasAvatarFile: false,
  avatarRemoved: false
}

describe('buildProfileUpdate', () => {
  it('只把真正改动的字段放入 PATCH 载荷', () => {
    expect(
      buildProfileUpdate(SNAPSHOT, {
        ...UNCHANGED_DRAFT,
        nickname: ' 李四 ',
        phone: '13900000000'
      })
    ).toEqual({
      payload: { nickname: '李四', phoneNumber: '13900000000' },
      isDirty: true
    })
  })

  it('忽略仅空白差异，无改动时不提交', () => {
    expect(
      buildProfileUpdate(SNAPSHOT, {
        ...UNCHANGED_DRAFT,
        nickname: ' 张三 ',
        phone: ' 13800000000 ',
        bio: ' 技术经理 '
      })
    ).toEqual({ payload: {}, isDirty: false })
  })

  it('清空昵称无法落库，单独清空时不算 dirty', () => {
    expect(buildProfileUpdate(SNAPSHOT, { ...UNCHANGED_DRAFT, nickname: '   ' })).toEqual({
      payload: {},
      isDirty: false
    })
  })

  it('移除已有头像时只提交 avatar: null', () => {
    expect(buildProfileUpdate(SNAPSHOT, { ...UNCHANGED_DRAFT, avatarRemoved: true })).toEqual({
      payload: { avatar: null },
      isDirty: true
    })
  })

  it('取消新选头像且原本无头像时不提交', () => {
    expect(
      buildProfileUpdate(
        { ...SNAPSHOT, hasAvatar: false },
        { ...UNCHANGED_DRAFT, avatarRemoved: true }
      )
    ).toEqual({ payload: {}, isDirty: false })
  })

  it('新头像由上传接口处理，payload 不含头像字段但标记 dirty', () => {
    expect(buildProfileUpdate(SNAPSHOT, { ...UNCHANGED_DRAFT, hasAvatarFile: true })).toEqual({
      payload: {},
      isDirty: true
    })
  })

  it('清空手机号和简介时提交 null', () => {
    expect(buildProfileUpdate(SNAPSHOT, { ...UNCHANGED_DRAFT, phone: '', bio: '  ' })).toEqual({
      payload: { phoneNumber: null, bio: null },
      isDirty: true
    })
  })

  it('生日变更时提交 YYYY-MM-DD', () => {
    expect(buildProfileUpdate(SNAPSHOT, { ...UNCHANGED_DRAFT, birthday: '1998-06-01' })).toEqual({
      payload: { birthday: '1998-06-01' },
      isDirty: true
    })
  })

  it('清除生日时提交 null', () => {
    expect(buildProfileUpdate(SNAPSHOT, { ...UNCHANGED_DRAFT, birthday: null })).toEqual({
      payload: { birthday: null },
      isDirty: true
    })
  })
})

describe('birthday local date helpers', () => {
  it('round-trips YYYY-MM-DD without shifting the calendar day', () => {
    expect(formatBirthday(parseBirthday('1995-06-15'))).toBe('1995-06-15')
  })
})
