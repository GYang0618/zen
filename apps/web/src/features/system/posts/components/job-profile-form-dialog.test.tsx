// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { JobProfileFormDialog } from './job-profile-form-dialog'

import type { ComponentProps } from 'react'

const mutations = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn()
}))

vi.mock('../queries', () => ({
  useCreateJobProfileMutation: () => ({ mutateAsync: mutations.create, isPending: false }),
  useUpdateJobProfileMutation: () => ({ mutateAsync: mutations.update, isPending: false })
}))

vi.mock('./job-profile-icon-picker', () => ({
  JobProfileIconPicker: () => <div>icon-picker</div>
}))

vi.mock('./job-profile-icon-color-picker', () => ({
  JobProfileIconColorPicker: () => <div>color-picker</div>
}))

vi.mock('@zen/ui', async () => {
  const actual = await vi.importActual<typeof import('@zen/ui')>('@zen/ui')
  return {
    ...actual,
    Dialog: ({ children }: ComponentProps<'div'>) => <div>{children}</div>,
    DialogContent: ({ children }: ComponentProps<'div'>) => <div>{children}</div>,
    DialogHeader: ({ children }: ComponentProps<'div'>) => <div>{children}</div>,
    DialogTitle: ({ children }: ComponentProps<'h2'>) => <h2>{children}</h2>,
    DialogFooter: ({ children }: ComponentProps<'div'>) => <div>{children}</div>
  }
})

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('JobProfileFormDialog', () => {
  it('空名称时阻止提交', async () => {
    render(<JobProfileFormDialog open mode="create" currentRow={null} onOpenChange={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('岗位名称'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: '确认创建' }))
    expect(await screen.findByText(/岗位名称不能为空/)).toBeTruthy()
    expect(mutations.create).not.toHaveBeenCalled()
  })

  it('合法字段提交创建请求', async () => {
    render(<JobProfileFormDialog open mode="create" currentRow={null} onOpenChange={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('岗位名称'), { target: { value: '前端工程师' } })
    fireEvent.change(screen.getByLabelText('岗位编码'), { target: { value: 'POS-1099' } })
    fireEvent.click(screen.getByRole('button', { name: '确认创建' }))
    await waitFor(() => expect(mutations.create).toHaveBeenCalledTimes(1))
    expect(mutations.create.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        name: '前端工程师',
        code: 'POS-1099',
        status: 'active'
      })
    )
  })
})
