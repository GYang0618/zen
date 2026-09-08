// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PluginConfigDialog } from './plugin-config-dialog'

import type { ComponentProps } from 'react'
import type { PluginListItem } from './api'

const mutateAsync = vi.hoisted(() => vi.fn())

vi.mock('./queries', () => ({
  useUpdatePluginConfig: () => ({ mutateAsync, isPending: false })
}))

vi.mock('@zen/ui', async () => {
  const actual = await vi.importActual<typeof import('@zen/ui')>('@zen/ui')
  return {
    ...actual,
    Dialog: ({ children }: ComponentProps<'div'>) => <div>{children}</div>,
    DialogContent: ({ children }: ComponentProps<'div'>) => <div>{children}</div>,
    DialogHeader: ({ children }: ComponentProps<'div'>) => <div>{children}</div>,
    DialogTitle: ({ children }: ComponentProps<'h2'>) => <h2>{children}</h2>,
    DialogDescription: ({ children }: ComponentProps<'p'>) => <p>{children}</p>
  }
})

const plugin: PluginListItem = {
  id: 'demo-notes',
  name: 'Demo Notes',
  version: '1.0.0',
  platformVersion: '1.0.0',
  dependsOn: [],
  status: 'active',
  installed: true,
  config: { enabled: true }
}

afterEach(() => {
  cleanup()
  mutateAsync.mockReset()
})

describe('PluginConfigDialog', () => {
  it('拒绝非法 JSON 并不提交', async () => {
    render(<PluginConfigDialog plugin={plugin} onOpenChange={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('插件 JSON 配置'), { target: { value: '{bad' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(await screen.findByText('JSON 格式无效')).toBeTruthy()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('合法 JSON 提交配置', async () => {
    render(<PluginConfigDialog plugin={plugin} onOpenChange={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('插件 JSON 配置'), {
      target: { value: '{"enabled":true}' }
    })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 'demo-notes',
        config: { enabled: true }
      })
    )
  })
})
