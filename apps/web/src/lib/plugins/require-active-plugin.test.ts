import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirectMock = vi.hoisted(() =>
  vi.fn((input: unknown) => {
    const error = new Error('REDIRECT')
    Object.assign(error, { isRedirect: true, input })
    return error
  })
)

vi.mock('@tanstack/react-router', () => ({
  redirect: redirectMock
}))

vi.mock('@/features/system/plugins/api', () => ({
  fetchActivePluginIds: vi.fn()
}))

import { fetchActivePluginIds } from '@/features/system/plugins/api'

import { requireActivePlugin } from './require-active-plugin'

describe('requireActivePlugin', () => {
  beforeEach(() => {
    vi.mocked(fetchActivePluginIds).mockReset()
    redirectMock.mockClear()
  })

  it('已启用插件时放行', async () => {
    vi.mocked(fetchActivePluginIds).mockResolvedValue(['demo-notes'])
    await expect(requireActivePlugin('demo-notes')).resolves.toBeUndefined()
  })

  it('未启用插件时跳转 403', async () => {
    vi.mocked(fetchActivePluginIds).mockResolvedValue([])
    await expect(requireActivePlugin('demo-notes')).rejects.toMatchObject({
      isRedirect: true,
      input: { to: '/errors/403', replace: true }
    })
    expect(redirectMock).toHaveBeenCalled()
  })
})
