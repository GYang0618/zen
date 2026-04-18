import { create } from 'zustand'

import type { AuthSession } from '@/features/auth'

export interface AuthUser {
  id: string
  username: string
  email: string
  nickname: string | null
  phone: string | null
}

export interface AuthState {
  accessToken: string | null
  isAuthenticated: boolean
  user: AuthUser | null

  setAuth: (session: AuthSession) => void
  setToken: (accessToken: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  user: null,

  setAuth: ({ accessToken, user }) => {
    set({
      accessToken,
      isAuthenticated: !!accessToken,
      user
    })
  },

  setToken: (accessToken) => {
    set({
      accessToken,
      isAuthenticated: !!accessToken
    })
  },

  clearAuth: () => {
    set({
      accessToken: null,
      isAuthenticated: false,
      user: null
    })
  }
}))
