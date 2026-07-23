import { create } from 'zustand'

import { getCookie, setCookie } from '@/lib/cookies'

type Locale = 'zh-CN' | 'en-US'

const MESSAGES: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    'app.name': 'Zen Admin',
    'nav.dashboard': '概览',
    'action.save': '保存',
    'action.cancel': '取消',
    'auth.welcome': '欢迎回来'
  },
  'en-US': {
    'app.name': 'Zen Admin',
    'nav.dashboard': 'Dashboard',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'auth.welcome': 'Welcome back'
  }
}

type I18nState = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const initialLocale = (getCookie('locale') as Locale | undefined) ?? 'zh-CN'

export const useI18nStore = create<I18nState>((set, get) => ({
  locale: initialLocale,
  setLocale: (locale) => {
    setCookie('locale', locale)
    set({ locale })
  },
  t: (key) => {
    const { locale } = get()
    return MESSAGES[locale][key] ?? MESSAGES['zh-CN'][key] ?? key
  }
}))
