// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SignInForm } from './sign-in/sign-in-form'
import { SignUpForm } from './sign-up/sign-up-form'

import type { ComponentProps } from 'react'

const mutations = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn() }))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: ComponentProps<'a'>) => <a href="/">{children}</a>,
  useNavigate: () => vi.fn(),
  useSearch: () => ({})
}))
vi.mock('./mutations', () => ({
  useSignInMutation: () => ({ mutate: mutations.signIn, isPending: false }),
  useSignUpMutation: () => ({ mutate: mutations.signUp, isPending: false }),
  useVerifyMfaMutation: () => ({ mutate: vi.fn(), isPending: false })
}))
vi.mock('./third-party-login', () => ({ ThirdPartyLogin: () => null }))
vi.mock('@/components', () => ({
  PasswordInput: (props: ComponentProps<'input'>) => <input {...props} type="password" />
}))
vi.mock('@zen/ui', () => ({
  Button: (props: ComponentProps<'button'>) => <button {...props} />,
  Input: (props: ComponentProps<'input'>) => <input {...props} />,
  Field: (props: ComponentProps<'div'>) => <div {...props} />,
  FieldGroup: (props: ComponentProps<'div'>) => <div {...props} />,
  FieldDescription: (props: ComponentProps<'div'>) => <div {...props} />,
  FieldSeparator: (props: ComponentProps<'div'>) => <div {...props} />,
  FieldLabel: ({ htmlFor, children }: ComponentProps<'label'>) => (
    <label htmlFor={htmlFor ?? 'test-input'}>{children}</label>
  ),
  FormActions: (props: ComponentProps<'div'>) => <div {...props} />,
  FieldError: ({ errors }: { errors: { message?: string }[] }) => (
    <div role="alert">{errors.map((error) => error.message).join(', ')}</div>
  ),
  sleep: () => Promise.resolve()
}))

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('TanStack authentication forms', () => {
  it('blocks invalid sign-in and submits the schema-transformed identifier', async () => {
    render(<SignInForm />)
    fireEvent.click(screen.getByRole('button', { name: '登录' }))
    expect((await screen.findAllByText('输入您的账号')).length).toBeGreaterThan(0)
    expect(mutations.signIn).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('账号'), { target: { value: '  test-user  ' } })
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password' } })
    fireEvent.click(screen.getByRole('button', { name: '登录' }))
    await waitFor(() => expect(mutations.signIn).toHaveBeenCalledTimes(1))
    expect(mutations.signIn.mock.calls[0]?.[0]).toEqual({
      identifier: 'test-user',
      password: 'password'
    })
  })

  it('revalidates password confirmation and excludes it from the registration payload', async () => {
    render(<SignUpForm />)
    fireEvent.change(screen.getByLabelText('用户名'), { target: { value: 'test_user' } })
    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('密码', { exact: true }), {
      target: { value: 'SecurePass1!' }
    })
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: '创建账户' }))
    expect(await screen.findByText('两次输入的密码不一致')).toBeTruthy()
    expect(mutations.signUp).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'SecurePass1!' } })
    fireEvent.click(screen.getByRole('button', { name: '创建账户' }))
    await waitFor(() => expect(mutations.signUp).toHaveBeenCalledTimes(1))
    expect(mutations.signUp.mock.calls[0]?.[0]).toEqual({
      username: 'test_user',
      email: 'test@example.com',
      password: 'SecurePass1!'
    })
  })
})
