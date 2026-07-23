import { create } from 'zustand'

import type { AuthSession } from '@zen/shared'

export interface AuthState {
  accessToken: string | null
  isAuthenticated: boolean
  mustChangePassword: boolean
  user: AuthSession['user'] | null

  setAuth: (session: AuthSession) => void
  setToken: (accessToken: string | null) => void
  clearMustChangePassword: () => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  mustChangePassword: false,
  user: null,

  setAuth: ({ accessToken, user, mustChangePassword }) => {
    set({
      accessToken,
      isAuthenticated: !!accessToken,
      mustChangePassword: Boolean(mustChangePassword),
      user
    })
  },

  setToken: (accessToken) => {
    set({
      accessToken,
      isAuthenticated: !!accessToken
    })
  },

  clearMustChangePassword: () => set({ mustChangePassword: false }),

  clearAuth: () => {
    set({
      accessToken: null,
      isAuthenticated: false,
      mustChangePassword: false,
      user: null
    })
  }
}))
